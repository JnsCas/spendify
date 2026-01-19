import { IsString, MaxLength } from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @MaxLength(100)
  customName: string;
}
