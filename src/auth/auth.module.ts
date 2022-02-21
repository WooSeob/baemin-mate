import { forwardRef, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UniversityEmailAuth } from "./entity/UniversityEmailAuth";
import { SessionAuthGuard } from "./guards/SessionAuthGuard";
import { UniversityModule } from "../university/university.module";
import { Session } from "./entity/Session";

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    TypeOrmModule.forFeature([UniversityEmailAuth]),
    TypeOrmModule.forFeature([Session]),
    UniversityModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
