import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { TransactionFilterDto } from './transaction-filter.dto';

export const TRANSACTION_SORTS = ['date_desc', 'date_asc', 'amount_desc', 'amount_asc'] as const;
export type TransactionSort = (typeof TRANSACTION_SORTS)[number];

export class TransactionQueryDto extends TransactionFilterDto {
  @IsOptional()
  @IsIn(TRANSACTION_SORTS)
  sort: TransactionSort = 'date_desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
