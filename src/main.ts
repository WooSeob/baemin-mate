import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join, resolve } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: { origin: "*" },
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const config = new DocumentBuilder()
    .setTitle("같이하실")
    .setDescription("같이하실 Rest API description")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer" }, "swagger-auth")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

/**
 * export interface SecuritySchemeObject {
    type: SecuritySchemeType;
    description?: string;
    name?: string;
    in?: string;
    scheme?: string;
    bearerFormat?: string;
    flows?: OAuthFlowsObject;
    openIdConnectUrl?: string;
}
 * */
