import { Module } from "@nestjs/common";
import { OAuthService } from "./o-auth.service";
import { NaverOAuthProviderService } from "./providers/NaverOAuthProviderService";
import { AppleOAuthProviderService } from "./providers/apple/AppleOAuthProviderService";

@Module({
  providers: [
    OAuthService,
    NaverOAuthProviderService,
    AppleOAuthProviderService,
  ],
  exports: [OAuthService],
})
export class OAuthModule {}
