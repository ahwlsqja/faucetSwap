import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ChainsModule } from '../chains/chains.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ChainsModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}