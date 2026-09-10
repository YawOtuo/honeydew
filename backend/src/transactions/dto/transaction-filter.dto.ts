import { PaymentMethod, TransactionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsDecimal, IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export const toArray = ({ value }: { value: unknown }) =>
  Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : value;

export class TransactionFilterDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethods?: PaymentMethod[];

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  minAmount?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  maxAmount?: string;
}
