import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  amountArs?: number;

  @IsNumber()
  @IsOptional()
  amountUsd?: number;

  @IsNumber()
  @IsOptional()
  currentInstallment?: number;

  @IsNumber()
  @IsOptional()
  totalInstallments?: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  cardId?: string;
}
