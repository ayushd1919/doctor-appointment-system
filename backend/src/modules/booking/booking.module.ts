import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Appointment } from './entities/appointment.entity';
import { WorkingRule } from '../doctor/entities/working_rule.entity';
import { Unavailability } from '../doctor/entities/unavailability.entity';
import { Doctor } from '../doctor/entities/doctor.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, WorkingRule, Unavailability, Doctor]), RealtimeModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
