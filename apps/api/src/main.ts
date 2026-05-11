import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { loadEnv } from "./config/env";
import { AppModule } from "./main/app.module";

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
  app.useBodyParser("json", { limit: "10mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "10mb" });
  await app.listen(env.PORT);
}

bootstrap();
