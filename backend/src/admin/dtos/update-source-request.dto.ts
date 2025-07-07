import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateSourceRequestDto {
  @IsOptional()
  @IsString()
  api_key?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}
