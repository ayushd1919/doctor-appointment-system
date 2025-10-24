import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { BookingModule } from './modules/booking/booking.module';
import { RealtimeModule } from './modules/realtime/realtime.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false, // use migrations
    }),

    ThrottlerModule.forRoot([
      { ttl: 60, limit: 100, name: 'default' }, // global default (already had this)
      { ttl: 60 * 60, limit: 5, name: 'book' }, // 5 requests/hour per IP
    ]),

    AuthModule,
    DoctorModule,
    BookingModule,
    RealtimeModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // global throttling
  ],
  
})
export class AppModule {}
