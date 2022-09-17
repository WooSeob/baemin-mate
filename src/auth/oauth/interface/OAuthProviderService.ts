import { OAuthProvider } from "../../interface/OAuthProvider";
import { OAuthInfo } from "../../interface/OAuthInfo";

export interface OAuthProviderService {
  getProvider(): OAuthProvider;
  getProviderSideIdentifier(oauthInfo: OAuthInfo): Promise<string>;
  verify(oauthInfo: OAuthInfo): Promise<boolean>;
}
