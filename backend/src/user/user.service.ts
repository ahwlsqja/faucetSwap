import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        wallets: true,
      },
    });
  }

  async findByAddress(address: string) {
    return this.prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        wallets: true,
      },
    });
  }

  async createUser(data: { address: string; email?: string }) {
    return this.prisma.user.create({
      data: {
        address: data.address.toLowerCase(),
        email: data.email,
      },
      include: {
        wallets: true,
      },
    });
  }

  async updateUser(id: string, data: { email?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        wallets: true,
      },
    });
  }
}