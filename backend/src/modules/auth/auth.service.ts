import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { Doctor } from '../doctor/entities/doctor.entity';
import { RegisterDto, LoginDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.doctorRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email already registered');

    const hash = await bcrypt.hash(dto.password, parseInt(process.env.BCRYPT_ROUNDS || '10', 10));
    const saved = await this.doctorRepo.save({
      name: dto.name,
      email: dto.email,
      password_hash: hash,
      specialty_id: dto.specialty_id,
    });

    // don’t return hash
    return { id: saved.id, name: saved.name, email: saved.email, specialty_id: saved.specialty_id };
  }

  async login(dto: LoginDto) {
    const doc = await this.doctorRepo.findOne({ where: { email: dto.email } });
    if (!doc) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, doc.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = jwt.sign(
      { sub: doc.id, email: doc.email, name: doc.name },
      (process.env.JWT_SECRET as jwt.Secret),            
      { expiresIn: (process.env.JWT_EXPIRES || '7d') } as jwt.SignOptions  
    );

    return {
      token,
      doctor: { id: doc.id, name: doc.name, email: doc.email, specialty_id: doc.specialty_id },
    };
  }
}
