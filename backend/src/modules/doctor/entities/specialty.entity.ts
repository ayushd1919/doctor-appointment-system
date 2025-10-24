import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('specialty')
export class Specialty {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) name: string;
}
