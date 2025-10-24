import { BadRequestException, Body, Controller, Get, Ip, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookingService } from './booking.service';
import { AnyAvailabilityQueryDto, AvailabilityQueryDto, BookDto } from './dtos';
import { DoctorsQueryDto } from './dtos';
import { verifyRecaptcha } from '../common/recaptcha';
import { Throttle } from '@nestjs/throttler';
import DOMPurify from 'isomorphic-dompurify';
import { SanitizePipe } from '../common/sanitize.pipe';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class BookingController {
  constructor(private readonly svc: BookingService) {}

  // Public: availability for a specific doctor
  @Get('public/availability')
  async availability(@Query() q: AvailabilityQueryDto) {
    const slots = await this.svc.availabilityForDoctor(q.doctor_id, q.from, q.days);
    return { doctor_id: q.doctor_id, slots };
  }

  // Public: "Any Available Doctor"
  @Get('public/availability/any')
  async availabilityAny(@Query() q: AnyAvailabilityQueryDto) {
    const slots = await this.svc.availabilityAny(q.from, q.days);
    return { slots };
  }

  // Public: booking (transaction-safe)
  @Post('public/book')
  @Throttle({ default: { ttl: 60 * 60, limit: 5 } })
  @UsePipes(new SanitizePipe(['patient_name','patient_email','patient_phone','reason'])) // 5/hour/IP
  async book(@Body() dto: BookDto, @Ip() ip: string) {
    // 1) CAPTCHA
    const captchaOk = await verifyRecaptcha(dto.captchaToken);
    if (!captchaOk) {
      // 400 + human-friendly hint for the frontend
      throw new BadRequestException({ ok: false, error: 'captcha_failed', retryAfter: 3 });
    }

    // 2) continue normal booking
    const result = await this.svc.book({
      any: dto.any,
      doctor_id: dto.doctor_id,
      start_at: dto.start_at,
      patient_name: dto.patient_name,
      patient_email: dto.patient_email,
      patient_phone: dto.patient_phone,
      reason: dto.reason ?? undefined,
      created_ip: ip || null,
    });
    return { ok: true, appointment: result };
  }

  // Public: search/filter doctors by name or specialty
  @Get('public/doctors')
  async listDoctors(@Query() q: DoctorsQueryDto) {
    return this.svc.searchDoctors(q);
  }

}
