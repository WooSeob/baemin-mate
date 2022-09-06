import { Module } from "@nestjs/common";
import { OAuthService } from "./o-auth.service";
import { NaverOAuthProviderService } from "./providers/NaverOAuthProviderService";
import { AppleOAuthProviderService } from "./providers/apple/AppleOAuthProviderService";
import { JwtModule } from "@nestjs/jwt";
import { AppleOAuthConfig } from "../../../config";

@Module({
  imports: [
    JwtModule.register({
      secret: AppleOAuthConfig.JwtConfig.getSecret(),
      signOptions: {
        expiresIn: AppleOAuthConfig.JwtConfig.defaultExpIn,
        algorithm: "RS256",
        keyid: AppleOAuthConfig.JwtConfig.keyid,
        issuer: AppleOAuthConfig.TEAM_ID,
        audience: AppleOAuthConfig.DOMAIN,
        subject: AppleOAuthConfig.CLIENT_ID,
      },
    }),
  ],
  providers: [
    OAuthService,
    NaverOAuthProviderService,
    AppleOAuthProviderService,
  ],
  exports: [OAuthService],
})
export class OAuthModule {}
