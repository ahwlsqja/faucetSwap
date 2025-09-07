import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async loginWithWallet(address: string, signature: string, message: string) {
    try {
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }

      // Find or create user
      let user = await this.userService.findByAddress(address);
      if (!user) {
        user = await this.userService.createUser({ address });
      }

      // Generate JWT token
      const payload = { sub: user.id, address: user.address };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: user.id,
          address: user.address,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateUser(userId: string) {
    return this.userService.findById(userId);
  }
}