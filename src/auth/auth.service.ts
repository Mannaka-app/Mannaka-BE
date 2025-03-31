import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly KAKAO_CLIENT_ID = process.env.KAKAO_REST_API_KEY;
  private readonly REDIRECT_URI = 'http://localhost:3000/auth/kakao/callback';
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly httpService: HttpService,
  ) {}

  // 회원 가입
  async register(registerDto: RegisterDto) {
    try {
      const existEmail = await this.prisma.users.findUnique({
        where: { email: registerDto.email },
      });

      if (existEmail)
        throw new ConflictException('이미 존재하는 이메일 입니다.');

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
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      throw new InternalServerErrorException('서버에서 오류가 발생했습니다.');
    }
  }

  // 로그인
  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) throw new UnauthorizedException('계정이 존재하지 않습니다.');

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
        throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('서버에서 오류가 발생했습니다.');
    }
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const tokenRes = await firstValueFrom(
      this.httpService.post(
        'https://kauth.kakao.com/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.KAKAO_REST_API_KEY,
          redirect_uri: 'http://localhost:3000/auth/kakao/callback',
          code,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    return tokenRes.data.access_token;
  }

  async getUserInfoFromKakao(accessToken: string) {
    const userRes = await firstValueFrom(
      this.httpService.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );

    const kakaoUser = userRes.data;
    console.log('✅ 카카오 사용자 정보:', kakaoUser);
    return kakaoUser;
  }

  async generateToken(data) {
    const token = this.jwt.sign({
      id: data.id,
      profile: data.kakao_acount.profile,
    });

    return token;
  }
}
