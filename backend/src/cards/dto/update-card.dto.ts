import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  customName?: string;
}
