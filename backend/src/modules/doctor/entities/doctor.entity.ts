import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Specialty } from './specialty.entity';

@Entity('doctor')
export class Doctor {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: 'text' }) name: string;

  @Column({ unique: true }) email: string;

  @Column({ type: 'text' }) password_hash: string;

  @Column({ type: 'int' }) specialty_id: number;

  @ManyToOne(() => Specialty)
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;
}
