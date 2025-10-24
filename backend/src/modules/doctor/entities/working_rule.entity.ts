import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('working_rule')
@Index(['doctor_id', 'weekday'])
export class WorkingRule {
  @PrimaryGeneratedColumn() id: number;
  @Column() doctor_id: number;
  @Column() weekday: number; // 0..6
  @Column({ type: 'time' }) start_time: string; // '09:00:00'
  @Column({ type: 'time' }) end_time: string;   // '17:00:00'
}