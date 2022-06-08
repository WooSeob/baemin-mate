import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  ArgumentMetadata,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AllExceptionsFilter } from "./common/exceptionfilter/all-exceptions.filter";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { AuthenticatedSocketIoAdapter } from "./common/adaptor/AuthenticatedSocketIoAdapter";
import { VersionCheckInterceptor } from "./common/interceptors/version-check.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: { origin: "*" },
  });
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);
  // app.useWebSocketAdapter(new AuthenticatedSocketIoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(app.get(VersionCheckInterceptor));
  app.useGlobalInterceptors(app.get(LoggingInterceptor));

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
