import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1761236090075 implements MigrationInterface {
    name = 'Init1761236090075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "working_rule" ("id" SERIAL NOT NULL, "doctor_id" integer NOT NULL, "weekday" integer NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, CONSTRAINT "PK_1824811c4eac9b0a87ce7cd0ee3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d28057b11556cd7ec75cde8d6e" ON "working_rule" ("doctor_id", "weekday") `);
        await queryRunner.query(`CREATE TABLE "specialty" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_6caedcf8a5f84e3072c5a380a16" UNIQUE ("name"), CONSTRAINT "PK_9cf4ae334dc4a1ab1e08956460e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "unavailability" ("id" SERIAL NOT NULL, "doctor_id" integer NOT NULL, "start_at" TIMESTAMP WITH TIME ZONE NOT NULL, "end_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reason" text, CONSTRAINT "PK_176e6b52ee1b44acea3b66e8aac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doctor" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "specialty_id" integer NOT NULL, CONSTRAINT "UQ_bf6303ac911efaab681dc911f54" UNIQUE ("email"), CONSTRAINT "PK_ee6bf6c8de78803212c548fcb94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appointment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_id" integer NOT NULL, "patient_name" text NOT NULL, "patient_email" text NOT NULL, "patient_phone" text NOT NULL, "reason" text, "start_at" TIMESTAMP WITH TIME ZONE NOT NULL, "end_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_ip" inet, CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6fb9ce6efa13b6f7ba11b894e5" ON "appointment" ("doctor_id", "start_at") `);
        await queryRunner.query(`ALTER TABLE "doctor" ADD CONSTRAINT "FK_bb2b1ec7556ecdf92c8b6cc8cf7" FOREIGN KEY ("specialty_id") REFERENCES "specialty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor" DROP CONSTRAINT "FK_bb2b1ec7556ecdf92c8b6cc8cf7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6fb9ce6efa13b6f7ba11b894e5"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TABLE "doctor"`);
        await queryRunner.query(`DROP TABLE "unavailability"`);
        await queryRunner.query(`DROP TABLE "specialty"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d28057b11556cd7ec75cde8d6e"`);
        await queryRunner.query(`DROP TABLE "working_rule"`);
    }

}
