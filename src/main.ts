import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  app.setGlobalPrefix("api", { exclude: [] });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`HanVerse API running on http://localhost:${port}`);
}
bootstrap();
