// auth.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthService {
  private clientId = process.env.KAKAO_REST_API_KEY;
  private redirectUri = process.env.KAKAO_REDIRECT_URI;

  getKakaoAuthURL(): string {
    const baseUrl = 'https://kauth.kakao.com/oauth/authorize';
    const query = `?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code`;
    return baseUrl + query;
  }

  async kakaoLogin(code: string): Promise<any> {
    // 1. Access Token 요청

    const tokenRes = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      {},
      {
        params: {
          grant_type: 'authorization_code',
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          code,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    const accessToken = tokenRes.data.access_token;

    // 2. 사용자 정보 요청
    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = userRes.data;

    // 3. DB에 사용자 저장 or 로그인 처리
    console.log(kakaoUser);
    return kakaoUser;
  }
}
