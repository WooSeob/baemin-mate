import { Injectable, Logger } from "@nestjs/common";
import { OAuthProviderService } from "../../interface/OAuthProviderService";
import { OAuthProvider } from "../../../interface/OAuthProvider";
import { OAuthInfo } from "../../../interface/OAuthInfo";
import { plainToClass } from "class-transformer";
import * as jwt from "jsonwebtoken";

import { JwksClient } from "jwks-rsa";
import { AppleOAuthConfig } from "../../../../../config";

@Injectable()
export class AppleOAuthProviderService implements OAuthProviderService {
  private readonly logger = new Logger("AppleOAuthProviderService");

  private RETRIEVE_PUBLIC_KEY_URL = "https://appleid.apple.com/auth/keys";
  private RETRIEVE_AUTH_TOKEN_URL = "https://appleid.apple.com/auth/token";

  constructor() {}

  getProvider(): OAuthProvider {
    return OAuthProvider.APPLE;
  }

  async getProviderSideIdentifier(oauthInfo: OAuthInfo): Promise<string> {
    const payload = plainToClass(
      AppleAuthorizationCredential,
      JSON.parse(oauthInfo.payload)
    );

    if (!(await this.verify(oauthInfo))) {
      this.logger.warn(`invalid claim. payload: ${payload}`);
      throw new Error("잘못된 identity token 입니다.");
    }

    return payload.user;
  }

  async verify(oauthInfo: OAuthInfo): Promise<boolean> {
    const payload = plainToClass(
      AppleAuthorizationCredential,
      JSON.parse(oauthInfo.payload)
    );

    const claim = await this.getClaimFromIdentityToken(payload);

    if (!claim) {
      this.logger.warn(`invalid claim. payload: ${payload}`);
      return false;
    }
    return true;
  }

  public async getClaimFromIdentityToken(
    payload: AppleAuthorizationCredential
  ): Promise<AppleIdentityTokenClaim> {
    const token = jwt.decode(payload.identityToken, {
      complete: true,
    });
    const kid = token["header"]["kid"];

    const signingKey = await new JwksClient({
      jwksUri: this.RETRIEVE_PUBLIC_KEY_URL,
    }).getSigningKey(kid);

    return jwt.verify(
      payload.identityToken,
      signingKey.getPublicKey()
    ) as AppleIdentityTokenClaim;
  }
}

class AppleAuthTokenRequest {
  client_id: string = AppleOAuthConfig.CLIENT_ID;
  grant_type: string = "authorization_code";
  client_secret: string;
  code: string;
}

export class AppleAuthorizationCredential {
  identityToken: string;
  authorizationCode: string;
  state: string;
  user: string;
}

class AppleIdentityTokenClaim {
  iss: string; // https://appleid.apple.com
  sub: string; // identifier for the user
  aud: string; // client_id
  iat: number; // issued at.  unix epoch
  exp: number; // exp. unix epoch utc
  nonce: string;
  nonce_supported;
  email: string;
  email_verified: string;
  is_private_email: string;
  real_user_status: number;
  transfer_sub: string;
}
