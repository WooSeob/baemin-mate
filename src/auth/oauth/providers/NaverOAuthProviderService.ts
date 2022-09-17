import { Injectable, Logger } from "@nestjs/common";
import { OAuthProviderService } from "../interface/OAuthProviderService";
import { OAuthProvider } from "../../interface/OAuthProvider";
import { OAuthInfo } from "../../interface/OAuthInfo";
import { NaverAuthResponse } from "../../interface/NaverAuthResponse";
import axios, { AxiosResponse } from "axios";
import { plainToClass } from "class-transformer";

@Injectable()
export class NaverOAuthProviderService implements OAuthProviderService {
  private readonly logger = new Logger("NaverOAuthProviderService");

  getProvider(): OAuthProvider {
    return OAuthProvider.NAVER;
  }

  async getProviderSideIdentifier(oauthInfo: OAuthInfo): Promise<string> {
    const payload = plainToClass(NaverOAuthInfo, JSON.parse(oauthInfo.payload));
    const userdata = await this.getUserdataFromNaver(payload.accessToken);
    return userdata.id;
  }

  async verify(oauthInfo: OAuthInfo): Promise<boolean> {
    const payload = plainToClass(NaverOAuthInfo, JSON.parse(oauthInfo.payload));
    const userdata = await this.getUserdataFromNaver(payload.accessToken);
    return userdata != null;
  }

  private async getUserdataFromNaver(
    token: string
  ): Promise<NaverAuthResponse> {
    try {
      let res: AxiosResponse;
      res = await axios.get("https://openapi.naver.com/v1/nid/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data.response;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}

class NaverOAuthInfo {
  accessToken: string;
}
