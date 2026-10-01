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
  app.useBodyParser("json", { limit: "50mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "50mb" });
  app.use(
    (
      _req: unknown,
      res: { getHeader: (name: string) => unknown; setHeader: (name: string, value: string) => void },
      next: () => void
    ) => {
    const currentType = res.getHeader("Content-Type");
    if (!currentType) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    next();
    }
  );
  app.use(
    (
      err: unknown,
      _req: unknown,
      res: { status: (code: number) => { json: (body: unknown) => void } },
      next: (err?: unknown) => void
    ) => {
      const isPayloadTooLarge =
        (typeof err === "object" && err !== null && (err as { type?: string; status?: number }).type === "entity.too.large") ||
        (typeof err === "object" && err !== null && (err as { status?: number }).status === 413);
      if (isPayloadTooLarge) {
        res.status(413).json({
          message: "As imagens enviadas são muito grandes. Reduza o tamanho das imagens e tente novamente."
        });
        return;
      }
      next(err);
    }
  );
  await app.listen(env.PORT);
}

bootstrap();
