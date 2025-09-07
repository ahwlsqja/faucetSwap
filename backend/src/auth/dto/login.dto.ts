import { IsString, IsEthereumAddress } from 'class-validator';

export class LoginDto {
  @IsEthereumAddress()
  address: string;

  @IsString()
  signature: string;

  @IsString()
  message: string;
}