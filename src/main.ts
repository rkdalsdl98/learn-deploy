import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: "*",
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  })

  app.useGlobalInterceptors(new LoggingInterceptor())

  await app.listen(80)
}
bootstrap();
