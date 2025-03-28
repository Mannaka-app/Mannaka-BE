import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // 회원 가입
  async register(registerDto: RegisterDto) {
    const existEmail = await this.prisma.users.findUnique({
      where: { email: registerDto.email },
    });

    if (existEmail) throw new ConflictException('이미 존재하는 이메일 입니다.');

    const saltRounds = 10;
    const hashPwd = await bcrypt.hash(registerDto.password, saltRounds);

    await this.prisma.users.create({
      data: {
        email: registerDto.email,
        password: hashPwd,
        name: registerDto.name,
      },
    });

    return { success: true, message: '회원가입이 완료되었습니다.' };
  }
}
