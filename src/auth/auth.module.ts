import { forwardRef, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { UniversityModule } from "../university/university.module";
import { JwtModule } from "@nestjs/jwt";
import { NotificationModule } from "../notification/notification.module";
import { JwtAuthGuard } from "./guards/JwtAuthGuard";
import { jwt as jwtConfig } from "../../config";
import { SignupModule } from "./signup/signup.module";
import { OAuthModule } from "./oauth/OAuthModule";

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    UniversityModule,
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.defaultExpIn },
    }),
    forwardRef(() => NotificationModule),
    OAuthModule,
    SignupModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
