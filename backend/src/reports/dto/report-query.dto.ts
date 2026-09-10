import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { TransactionFilterDto } from '../../transactions/dto/transaction-filter.dto';

export class ReportQueryDto extends TransactionFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}
