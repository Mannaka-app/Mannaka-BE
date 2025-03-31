import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원 가입
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Get('kakao/login')
  kakaoLogin(@Res() res: Response) {
    const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    const REDIRECT_URI = 'http://localhost:3000/auth/kakao/callback';

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;
    res.redirect(kakaoAuthUrl);
  }

  @Get('kakao/callback')
  async kakaoCallback(@Query('code') code: string, @Res() res: Response) {
    const accessToken = await this.authService.exchangeCodeForToken(code);
    const userInfo = await this.authService.getUserInfoFromKakao(accessToken);

    const token = await this.authService.generateToken(userInfo);

    const redirectUrl = `ball://login?token=${token}`;
    return res.redirect(redirectUrl);
  }

  @Get('kakao/logout')
  kakaoLogout(@Res() res: Response) {
    const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    const LOGOUT_REDIRECT_URI =
      'http://localhost:3000/auth/kakao/logout-success'; // 나중에 프론트로 딥링크 가능

    const logoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${REST_API_KEY}&logout_redirect_uri=${LOGOUT_REDIRECT_URI}`;
    res.redirect(logoutUrl);
  }

  @Get('kakao/logout-success')
  logoutSuccess() {
    return '🧼 카카오 로그아웃 완료!';
  }
}
