import { Module } from "@nestjs/common";
import { MatchModule } from "./match/match.module";
import { ChatModule } from "./chat/chat.module";
import { AuthModule } from "./auth/auth.module";
import { RoomModule } from "./room/room.module";
import { ContainerModule } from "./core/container/container.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user/entity/user.entity";

@Module({
  imports: [
    MatchModule,
    ChatModule,
    AuthModule,
    RoomModule,
    ContainerModule,
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "test",
      password: "12341234",
      database: "test",
      entities: [User],
      synchronize: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
