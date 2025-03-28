import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 필드 제거
      forbidNonWhitelisted: true, // 정의되지 않은 필드가 있으면 에러
      transform: true, // class-transformer 적용
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
