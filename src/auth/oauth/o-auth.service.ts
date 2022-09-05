import { Injectable } from "@nestjs/common";
import { OAuthInfo } from "../interface/OAuthInfo";
import { AppleOAuthProviderService } from "./providers/apple/AppleOAuthProviderService";
import { NaverOAuthProviderService } from "./providers/NaverOAuthProviderService";
import { OAuthProvider } from "../interface/OAuthProvider";
import { OAuthProviderService } from "./interface/OAuthProviderService";

@Injectable()
export class OAuthService {
  private services: Map<OAuthProvider, OAuthProviderService> = new Map<
    OAuthProvider,
    OAuthProviderService
  >();

  constructor(
    private appleService: AppleOAuthProviderService,
    private naverService: NaverOAuthProviderService
  ) {
    this.services.set(appleService.getProvider(), appleService);
    this.services.set(naverService.getProvider(), naverService);
  }

  getProviderSideIdentifier(oauthInfo: OAuthInfo): Promise<string> {
    const service = this.services.get(oauthInfo.provider);
    return service.getProviderSideIdentifier(oauthInfo);
  }

  verify(oauthInfo: OAuthInfo): Promise<boolean> {
    const service = this.services.get(oauthInfo.provider);
    return service.verify(oauthInfo);
  }
}
