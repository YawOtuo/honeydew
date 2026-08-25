import { PaymentMethod, TransactionType } from '@prisma/client';
import { IsDecimal, IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsDecimal({ decimal_digits: '0,2' })
  amount!: string;

  @IsString()
  categoryId!: string;

  @IsISO8601()
  transactionDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
