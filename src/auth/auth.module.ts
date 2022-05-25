import { forwardRef, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UniversityEmailAuthEntity } from "./entity/university-email-auth.entity";
import { UniversityModule } from "../university/university.module";
import { JwtModule } from "@nestjs/jwt";
import { NotificationModule } from "../notification/notification.module";
import { JwtAuthGuard } from "./guards/JwtAuthGuard";
import { jwt as jwtConfig } from "../../config";

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    TypeOrmModule.forFeature([UniversityEmailAuthEntity]),
    UniversityModule,
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.defaultExpIn },
    }),
    forwardRef(() => NotificationModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
