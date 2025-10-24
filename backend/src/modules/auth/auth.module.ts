import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { Doctor } from '../doctor/entities/doctor.entity';
import { Specialty } from '../doctor/entities/specialty.entity'; // 👈 add

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Specialty]), // 👈 include Specialty
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [PassportModule],
})
export class AuthModule {}
