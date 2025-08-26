import { IsEmail, IsOptional, IsEthereumAddress } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEthereumAddress()
  address: string;
}