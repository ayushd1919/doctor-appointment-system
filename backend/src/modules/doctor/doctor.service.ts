import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { Appointment } from '../booking/entities/appointment.entity';
import { WorkingRule } from './entities/working_rule.entity';
import { Unavailability } from './entities/unavailability.entity';
import { AvailabilityQueryDto, CreateUnavailabilityDto, RangeQueryDto, UpsertWorkingRulesDto } from './dtos';
import { addMinutes, atMidnightUTC, isWeekendUTC } from '../booking/date-utils';
import { BookingService } from '../booking/booking.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class DoctorService {
  constructor(
    private readonly rt: RealtimeGateway, 
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Appointment) private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(WorkingRule) private readonly rulesRepo: Repository<WorkingRule>,
    @InjectRepository(Unavailability) private readonly unavRepo: Repository<Unavailability>,
    private readonly bookingSvc: BookingService, // reuse slot generator
  ) {}

  async me(doctorId: number) {
    const doc = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doc) throw new NotFoundException('Doctor not found');
    return { id: doc.id, name: doc.name, email: doc.email, specialty_id: doc.specialty_id };
  }

  async appointmentsToday(doctorId: number) {
    const now = new Date();
    const start = atMidnightUTC(now);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
    const appts = await this.apptRepo.find({
      where: { doctor_id: doctorId, start_at: Between(start, end) },
      order: { start_at: 'ASC' },
    });
    return appts;
  }

  async appointmentsRange(doctorId: number, q: RangeQueryDto) {
    const start = atMidnightUTC(new Date(q.from));
    const to = atMidnightUTC(new Date(q.to));
    if (!(start < to)) throw new BadRequestException('from must be < to');
    const appts = await this.apptRepo.find({
      where: { doctor_id: doctorId, start_at: Between(start, to) },
      order: { start_at: 'ASC' },
    });
    return appts;
  }

  async availability(doctorId: number, q: AvailabilityQueryDto) {
    return this.bookingSvc.availabilityForDoctor(doctorId, q.from, q.days);
  }

  async upsertWorkingRules(doctorId: number, body: UpsertWorkingRulesDto) {
    // Basic validation: Mon–Fri only, start < end
    for (const r of body.rules) {
      if (isWeekendIndex(r.weekday)) throw new BadRequestException('Weekends are blocked (weekday 1..5)');
      if (!isStartBeforeEnd(r.start_time, r.end_time)) throw new BadRequestException('start_time must be < end_time');
    }
    // Upsert per (doctor, weekday): delete existing weekdays in payload, then insert new
    const weekdays = body.rules.map(r => r.weekday);
    await this.rulesRepo.delete({ doctor_id: doctorId, weekday: In(weekdays) });
    const rows = body.rules.map(r => this.rulesRepo.create({ doctor_id: doctorId, weekday: r.weekday, start_time: r.start_time, end_time: r.end_time }));
    await this.rulesRepo.save(rows);
    return { ok: true, updated: rows.length };
  }

  async createUnavailability(doctorId: number, dto: CreateUnavailabilityDto) {
    const start = new Date(dto.start_at);
    const end = new Date(dto.end_at);
    if (!(start < end)) throw new BadRequestException('start_at must be < end_at');
    if (isWeekendUTC(start) || isWeekendUTC(end)) throw new BadRequestException('Weekends are blocked');
    const unav = this.unavRepo.create({
      doctor_id: doctorId,
      start_at: start,
      end_at: end,
      reason: dto.reason ?? null,
    });
    await this.unavRepo.save(unav);
    try {
      this.rt.unavailabilityAdded({
        doctor_id: doctorId,
        id: unav.id,
        start_at: unav.start_at.toISOString(),
        end_at: unav.end_at.toISOString(),
      });
    } catch {}
    return { ok: true, id: unav.id };
  }

  async deleteUnavailability(doctorId: number, id: number) {
    const row = await this.unavRepo.findOne({ where: { id } });
    if (!row || row.doctor_id !== doctorId) throw new NotFoundException('Not found');
    await this.unavRepo.delete(id);
    try {
      this.rt.unavailabilityDeleted({ doctor_id: doctorId, id });
    } catch {}
    return { ok: true };
  }
}

// ---- helpers ----
function isWeekendIndex(weekday: number) {
  return weekday === 0 || weekday === 6;
}
function isStartBeforeEnd(a: string, b: string) {
  return toMinutes(a) < toMinutes(b);
}
function toMinutes(t: string) {
  const [hh, mm, ss] = t.split(':').map(v => parseInt(v, 10));
  return (hh || 0) * 60 + (mm || 0) + ((ss || 0) > 0 ? 0 : 0);
}
