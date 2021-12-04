import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { INestApplication } from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule, {
    cors: { origin: "*" },
  });
  app.useWebSocketAdapter(new IoAdapter(app));

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
