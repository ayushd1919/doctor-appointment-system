import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('appointment')
@Index(['doctor_id', 'start_at'], { unique: true })
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  doctor_id: number;

  @Column({ type: 'text' })
  patient_name: string;

  @Column({ type: 'text' })
  patient_email: string;

  @Column({ type: 'text' })
  patient_phone: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'timestamptz' })
  start_at: Date;

  @Column({ type: 'timestamptz' })
  end_at: Date;

  // Use inet for IPv4/IPv6, or switch to 'text' if you prefer
  @Column({ type: 'inet', nullable: true })
  created_ip: string | null;
}
