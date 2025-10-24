import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('unavailability')
export class Unavailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctor_id: number;

  @Column({ type: 'timestamptz' })
  start_at: Date;

  @Column({ type: 'timestamptz' })
  end_at: Date;

  // 👇 FIX: ensure it's a string + give an explicit DB type
  @Column({ type: 'text', nullable: true })
  reason: string | null;
}
