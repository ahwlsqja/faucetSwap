import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { address, signature, message } = loginDto;
    return this.authService.loginWithWallet(address, signature, message);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('nonce')
  getNonce() {
    // Generate a random nonce for wallet signature
    const nonce = Math.floor(Math.random() * 1000000);
    const message = `Please sign this message to authenticate with FaucetSwap.\nNonce: ${nonce}`;
    return { message, nonce };
  }
}