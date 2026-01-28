import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsIn(['en', 'es'])
  language?: string;
}
