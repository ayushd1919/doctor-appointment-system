import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { WorkingRule } from '../doctor/entities/working_rule.entity';
import { Unavailability } from '../doctor/entities/unavailability.entity';
import { Doctor } from '../doctor/entities/doctor.entity';
import { addMinutes, atMidnightUTC, combineDateAndTimeUTC, isWeekendUTC } from './date-utils';
import { ILike } from 'typeorm';
import { Specialty } from '../doctor/entities/specialty.entity';
import { sendBookingNotifications } from '../common/notifier';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type Slot = { start: Date; end: Date; doctor_id: number };

@Injectable()
export class BookingService {
  private SLOT_MINUTES = 20;

  constructor(
    private readonly rt: RealtimeGateway,
    @InjectRepository(Appointment) private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(WorkingRule) private readonly ruleRepo: Repository<WorkingRule>,
    @InjectRepository(Unavailability) private readonly unavRepo: Repository<Unavailability>,
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
  ) {}

  /** Public: availability for a single doctor across a window */
  async availabilityForDoctor(doctor_id: number, fromISODate: string, days: number) {
    const fromDay = atMidnightUTC(new Date(fromISODate));
    const toDay = new Date(fromDay);
    toDay.setUTCDate(toDay.getUTCDate() + days);

    // Preload rules for Mon–Fri for speed
    const rules = await this.ruleRepo.find({ where: { doctor_id } });

    const slots: Slot[] = [];
    const now = new Date();

    for (let d = new Date(fromDay); d < toDay; d.setUTCDate(d.getUTCDate() + 1)) {
      if (isWeekendUTC(d)) continue;

      const weekday = d.getUTCDay(); // 1..5 relevant
      const dayRules = rules.filter(r => r.weekday === weekday);
      if (dayRules.length === 0) continue;

      const dayStart = atMidnightUTC(d);
      const dayEnd = new Date(dayStart); dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const [unavs, appts] = await Promise.all([
        this.unavRepo.find({
          where: { doctor_id, start_at: LessThan(dayEnd), end_at: MoreThanOrEqual(dayStart) },
        }),
        this.apptRepo.find({
          where: { doctor_id, start_at: Between(dayStart, dayEnd) },
          select: ['start_at'],
        }),
      ]);
      const taken = new Set(appts.map(a => a.start_at.toISOString()));

      for (const r of dayRules) {
        // r.start_time/end_time are TIME columns (e.g., '09:00:00')
        let t = combineDateAndTimeUTC(dayStart, r.start_time);
        const end = combineDateAndTimeUTC(dayStart, r.end_time);
        while (t < end) {
          const s = t;
          const e = addMinutes(s, this.SLOT_MINUTES);

          if (s < now) { t = e; continue; }               // exclude past
          if (taken.has(s.toISOString())) { t = e; continue; }
          if (this.overlapsAny(s, e, unavs)) { t = e; continue; }

          slots.push({ start: new Date(s), end: new Date(e), doctor_id });
          t = e;
        }
      }
    }
    return slots;
  }

  /** Public: earliest slots across all doctors */
  async availabilityAny(fromISODate: string, days: number) {
    const doctors = await this.doctorRepo.find({ select: ['id'] });
    const results = await Promise.all(
      doctors.map(d => this.availabilityForDoctor(d.id, fromISODate, days))
    );
    return results.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /** Transaction-safe booking; if any=true, doctor_id is determined from earliest available */
  async book(params: {
    any: boolean;
    doctor_id?: number;
    start_at: string;
    patient_name: string;
    patient_email: string;
    patient_phone: string;
    reason?: string;
    created_ip?: string | null;
  }) {
    const start_at = new Date(params.start_at);
    if (isNaN(start_at.getTime())) throw new BadRequestException('Invalid start_at');
    if (isWeekendUTC(start_at)) throw new BadRequestException('Weekends are blocked');

    let doctor_id = params.doctor_id;
    if (params.any) {
      const slots = await this.availabilityAny(start_at.toISOString().slice(0, 10), 14);
      const match = slots.find(s => s.start.toISOString() === start_at.toISOString());
      if (!match) throw new NotFoundException('No available doctor for the requested time');
      doctor_id = match.doctor_id;
    }
    if (!doctor_id) throw new BadRequestException('doctor_id required when any=false');

    // Re-check inside a transaction to avoid races
    const qr = this.apptRepo.manager.connection.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // Ensure slot is still free
      const overlapUnav = await qr.manager.findOne(Unavailability, {
        where: {
          doctor_id,
          start_at: LessThan(addMinutes(start_at, this.SLOT_MINUTES)),
          end_at: MoreThanOrEqual(start_at),
        },
      });
      if (overlapUnav) throw new ConflictException('Slot is unavailable');

      const existing = await qr.manager.findOne(Appointment, {
        where: { doctor_id, start_at },
        lock: { mode: 'pessimistic_read' }, // light lock; unique index still the final guard
      });
      if (existing) throw new ConflictException('Slot already booked');

      const appt = qr.manager.create(Appointment, {
        doctor_id,
        patient_name: params.patient_name,
        patient_email: params.patient_email,
        patient_phone: params.patient_phone,
        reason: params.reason ?? null,
        start_at,
        end_at: addMinutes(start_at, this.SLOT_MINUTES),
        created_ip: params.created_ip ?? null,
      });

      await qr.manager.save(appt); // unique index (doctor_id,start_at) protects against double-book
      await qr.commitTransaction();
      try {
        this.rt.appointmentBooked({
          doctor_id,
          start_at: appt.start_at.toISOString(),
          end_at: appt.end_at.toISOString(),
        });
      } catch {}
      try {
        await sendBookingNotifications({
          email: params.patient_email,
          phone: params.patient_phone,
          doctor_id,
          start_at: appt.start_at.toISOString(),
        });
      } catch (error) {
        console.error('Notification error:', error);
      }
      return { id: appt.id, doctor_id, start_at: appt.start_at, end_at: appt.end_at };
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async searchDoctors(q: { search?: string; specialty_id?: number }) {
    const where: any = {};
    if (q.search) {
      // ILike for case-insensitive partial match on name
      where.name = ILike(`%${q.search}%`);
    }
    if (q.specialty_id) {
      where.specialty_id = q.specialty_id;
    }

    const docs = await this.doctorRepo.find({
      where,
      relations: [],
      select: ['id', 'name', 'email', 'specialty_id'],
      order: { name: 'ASC' },
    });

    // attach specialty name
    const specIds = [...new Set(docs.map(d => d.specialty_id))];
    const specs = await this.ruleRepo.manager.getRepository(Specialty).findBy({ id: In(specIds) });
    const specMap = new Map(specs.map(s => [s.id, s.name]));

    return docs.map(d => ({
      id: d.id,
      name: d.name,
      email: d.email,
      specialty_id: d.specialty_id,
      specialty: specMap.get(d.specialty_id) || null,
    }));
  }

  // ---- helpers ----

  private overlapsAny(start: Date, end: Date, unavs: Unavailability[]) {
    // overlap if (start < unav.end_at) && (end > unav.start_at)
    return unavs.some(u => start < u.end_at && end > u.start_at);
  }
}
