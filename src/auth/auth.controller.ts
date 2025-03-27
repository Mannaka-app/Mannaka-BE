// auth.controller.ts
import { Controller, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('kakao/login')
  kakaoLogin(@Res() res: Response) {
    const redirectUrl = this.authService.getKakaoAuthURL();
    return res.redirect(redirectUrl);
  }

  @Get('kakao/callback')
  async kakaoCallback(@Query('code') code: string, @Res() res: Response) {
    const user = await this.authService.kakaoLogin(code);
    return res.json(user); // JWT 발급 or 유저 정보 응답
  }
}
