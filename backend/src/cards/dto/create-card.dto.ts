import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  cardName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4)
  lastFourDigits?: string;

  @IsBoolean()
  @IsOptional()
  isExtension?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  holderName?: string;
}
