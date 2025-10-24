import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { Specialty } from './entities/specialty.entity';
import { WorkingRule } from './entities/working_rule.entity';
import { Unavailability } from './entities/unavailability.entity';
import { Appointment } from '../booking/entities/appointment.entity';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { BookingModule } from '../booking/booking.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Specialty, WorkingRule, Unavailability, Appointment]),
    BookingModule, 
    RealtimeModule,
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [TypeOrmModule],
})
export class DoctorModule {}
