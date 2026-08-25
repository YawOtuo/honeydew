import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiTags('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary') summary(@Query() query: ReportQueryDto) { return this.reportsService.summary(query); }
  @Get('by-category') byCategory(@Query() query: ReportQueryDto) { return this.reportsService.byCategory(query); }
  @Get('monthly') monthly(@Query() query: ReportQueryDto) { return this.reportsService.monthly(query); }
}
