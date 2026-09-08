import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class CategoryQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeArchived = false;
}
