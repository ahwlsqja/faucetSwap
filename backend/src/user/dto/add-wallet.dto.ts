import { IsString, IsEthereumAddress } from 'class-validator';

export class AddWalletDto {
  @IsString()
  chain: string;

  @IsEthereumAddress()
  address: string;
}