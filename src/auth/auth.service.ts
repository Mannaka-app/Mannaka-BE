import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

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

  // 로그인
  async login(loginDto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) throw new Error('계정이 존재하지 않습니다.');

    const validPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (validPassword) {
      const accessToken = this.jwt.sign({
        sub: user.id,
        email: user.email,
        name: user.name,
      });
      return { success: true, message: '로그인에 성공했습니다', accessToken };
    } else {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
  }
}
