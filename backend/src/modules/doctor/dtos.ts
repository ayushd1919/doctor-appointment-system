import { Transform } from 'class-transformer';
import { IsArray, ArrayMinSize, IsISO8601, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RangeQueryDto {
  @IsISO8601() from: string; // YYYY-MM-DD
  @IsISO8601() to: string;   // YYYY-MM-DD
}

export class AvailabilityQueryDto {
  @IsISO8601() from: string; // YYYY-MM-DD
  @IsInt() @Min(1) @Max(31)
  @Transform(({ value }) => parseInt(value, 10)) days: number;
}

export class WorkingRuleDto {
  @IsInt() @Min(1) @Max(5) // 1=Mon .. 5=Fri
  weekday: number;

  // HH:MM(:SS) 24h
  @IsString() @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  start_time: string;

  @IsString() @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  end_time: string;
}

export class UpsertWorkingRulesDto {
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkingRuleDto)
  rules: WorkingRuleDto[];
}

export class CreateUnavailabilityDto {
  @IsISO8601() start_at: string; // full ISO string in UTC
  @IsISO8601() end_at: string;
  @IsOptional() @IsString() reason?: string;
}

export class UnavailabilityIdParam {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt() id: number;
}
