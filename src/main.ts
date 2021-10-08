import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { INestApplication } from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import { IoAdapter } from "@nestjs/platform-socket.io";

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  // const baseAddress = `ws://${address.address}:${address.port}`;
  // const baseAddress = `ws://localhost:3000`;
  // let clientSocket: Socket = io(`${baseAddress}`, {
  //   transports: ["websocket"],
  // });

  // clientSocket.on("connect", () => {
  //   console.log("client connected");

  //   clientSocket.on("events", (msg) => {
  //     console.log("client received - events : ", msg);
  //   });
  //   clientSocket.emit("events", {
  //     user: "wooseob!",
  //   });

  //   clientSocket.on("identity", (arg) => {
  //     console.log("client received - identity : ", arg);
  //   });
  //   clientSocket.emit("identity", 123123);
  // });
}
bootstrap();

/*
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
*/
