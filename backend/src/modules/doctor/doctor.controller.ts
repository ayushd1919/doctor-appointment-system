import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from './doctor.service';
import { AvailabilityQueryDto, CreateUnavailabilityDto, RangeQueryDto, UnavailabilityIdParam, UpsertWorkingRulesDto } from './dtos';
import { Between } from 'typeorm/find-options/operator/Between.js';
import { SanitizePipe } from '../common/sanitize.pipe';

@Controller('doctor')
@UseGuards(AuthGuard('jwt'))
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DoctorController {
  constructor(private readonly svc: DoctorService) {}

  @Get('me')
  async me(@Req() req: any) {
    return this.svc.me(req.user.id);
  }

  @Get('appointments/today')
  async today(@Req() req: any) {
    return this.svc.appointmentsToday(req.user.id);
  }

  @Get('appointments')
  async range(@Req() req: any, @Query() q: RangeQueryDto) {
    return this.svc.appointmentsRange(req.user.id, q);
  }

  @Get('availability')
  async availability(@Req() req: any, @Query() q: AvailabilityQueryDto) {
    return this.svc.availability(req.user.id, q);
  }

  @Post('working-rules')
  async upsertRules(@Req() req: any, @Body() body: UpsertWorkingRulesDto) {
    return this.svc.upsertWorkingRules(req.user.id, body);
  }

  @Post('unavailability')
  @UsePipes(new SanitizePipe(['reason']))
  async createUnavailability(@Req() req: any, @Body() dto: CreateUnavailabilityDto) {
    return this.svc.createUnavailability(req.user.id, dto);
  }

  @Delete('unavailability/:id')
  async deleteUnavailability(@Req() req: any, @Param() p: UnavailabilityIdParam) {
    return this.svc.deleteUnavailability(req.user.id, p.id);
  }

  @Get('unavailability')
  async listUnavailability(@Req() req: any, @Query('from') from: string, @Query('to') to: string) {
    const start = new Date(from); const end = new Date(to);
    return { items: await this.svc['unavRepo'].find({
      where: { doctor_id: req.user.id, start_at: Between(start, end) },
      order: { start_at: 'ASC' },
    })};
  }
}
