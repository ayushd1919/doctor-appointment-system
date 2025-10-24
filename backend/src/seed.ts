import 'dotenv/config';
import dataSource from '../ormconfig';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Specialty } from './modules/doctor/entities/specialty.entity';
import { Doctor } from './modules/doctor/entities/doctor.entity';
import { WorkingRule } from './modules/doctor/entities/working_rule.entity';

async function upsertSpecialty(ds: DataSource, name: string) {
  await ds.getRepository(Specialty).upsert({ name }, ['name']);
  return ds.getRepository(Specialty).findOneOrFail({ where: { name } });
}

async function upsertDoctor(
  ds: DataSource,
  { name, email, password_hash, specialty_id }: { name: string; email: string; password_hash: string; specialty_id: number }
) {
  await ds.getRepository(Doctor).upsert({ name, email, password_hash, specialty_id }, ['email']);
  return ds.getRepository(Doctor).findOneOrFail({ where: { email } });
}

async function setWorkingRules(ds: DataSource, doctor_id: number, rules: Array<{ weekday: number; start_time: string; end_time: string }>) {
  const repo = ds.getRepository(WorkingRule);
  // Replace all rules for the doctor with the provided set
  await repo.delete({ doctor_id });
  await repo.save(rules.map(r => ({ doctor_id, ...r })));
}

(async () => {
  const ds = await (dataSource as DataSource).initialize();

  // --- Specialties ---
  const sp1 = await upsertSpecialty(ds, 'General Physician');
  const sp2 = await upsertSpecialty(ds, 'Cardiologist');
  const sp3 = await upsertSpecialty(ds, 'Pediatrician');

  // --- Password hash ---
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const pass = await bcrypt.hash('password123', rounds);

  // --- Doctors ---
  const dr1 = await upsertDoctor(ds, { name: 'Dr. Sarah Johnson',   email: 'sarah@example.com',   password_hash: pass, specialty_id: sp1.id });
  const dr2 = await upsertDoctor(ds, { name: 'Dr. Michael Chen',    email: 'michael@example.com', password_hash: pass, specialty_id: sp2.id });
  const dr3 = await upsertDoctor(ds, { name: 'Dr. Emily Rodriguez', email: 'emily@example.com',   password_hash: pass, specialty_id: sp3.id });

  // --- Working rules ---
  // Dr. Johnson: Mon–Fri 09:00–17:00
  await setWorkingRules(ds, dr1.id, [1,2,3,4,5].map(wd => ({ weekday: wd, start_time: '09:00', end_time: '17:00' })));
  // Dr. Chen: Mon–Fri 10:00–18:00 (overlap 10–17)
  await setWorkingRules(ds, dr2.id, [1,2,3,4,5].map(wd => ({ weekday: wd, start_time: '10:00', end_time: '18:00' })));
  // Dr. Emily: M/W/F 08:00–16:00; Tue/Thu 13:00–19:00
  await setWorkingRules(ds, dr3.id, [1,3,5].map(wd => ({ weekday: wd, start_time: '08:00', end_time: '16:00' })));
  await setWorkingRules(ds, dr3.id, [
    ...[1,3,5].map(wd => ({ weekday: wd, start_time: '08:00', end_time: '16:00' })),
    ...[2,4].map(wd => ({ weekday: wd, start_time: '13:00', end_time: '19:00' })),
  ]);

  console.log('Seed complete:');
  console.log(' - General Physician: Dr. Sarah Johnson  (sarah@example.com / password123)');
  console.log(' - Cardiologist:      Dr. Michael Chen   (michael@example.com / password123)');
  console.log(' - Pediatrician:      Dr. Emily Rodriguez(emily@example.com / password123)');

  await ds.destroy();
  process.exit(0);
})().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
