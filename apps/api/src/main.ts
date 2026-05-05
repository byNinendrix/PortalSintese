import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "./config/env";
import { AppModule } from "./main/app.module";

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : env.CORS_ORIGIN,
    credentials: true
  });
  await app.listen(env.PORT);
}

bootstrap();
