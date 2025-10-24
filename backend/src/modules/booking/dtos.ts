import { IsBoolean, IsEmail, IsInt, IsISO8601, IsOptional, IsString, MinLength, Min, Max, IsIn, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class AvailabilityQueryDto {
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  doctor_id: number;

  @IsISO8601()
  from: string; // YYYY-MM-DD

  @IsInt() @Min(1) @Max(31)
  @Transform(({ value }) => parseInt(value, 10))
  days: number; // e.g., 7 or 14
}

export class AnyAvailabilityQueryDto {
  @IsISO8601()
  from: string;

  @IsInt() @Min(1) @Max(31)
  @Transform(({ value }) => parseInt(value, 10))
  days: number;
}

export class BookDto {
  @IsOptional() @IsInt()
  doctor_id?: number;

  @IsBoolean()
  any: boolean;

  @IsISO8601()
  start_at: string; // ISO timestamp in UTC (e.g., 2025-10-24T10:00:00Z)

  @IsString() @MinLength(2)
  patient_name: string;

  @IsEmail()
  patient_email: string;

  @IsString()  
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'phone must be E.164 like +919900011223' })
  patient_phone: string;

  @IsOptional() @IsString()
  reason?: string;

  @IsOptional() @IsString()
  captchaToken?: string;

}

export class DoctorsQueryDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsInt()
  @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
  specialty_id?: number;

  

  // (optional) pagination later
}
