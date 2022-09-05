import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import CreateSignupSessionRequestV1 from "./dto/request/CreateSignupSessionRequestV1";
import { CreateSignupSessionResponseV1 } from "./dto/response/CreateSignupSessionResponseV1";
import { ApiHeader } from "@nestjs/swagger";
import { SignupService } from "./signup.service";
import VerifyCodeRequestV1 from "./dto/request/VerifyCodeRequestV1";
import { VerifyCodeResponseV1 } from "./dto/response/VerifyCodeResponseV1";
import SubmitUserInfoRequestV1 from "./dto/request/SubmitUserInfoRequestV1";
import { SubmitUserInfoResponseV1 } from "./dto/response/SubmitUserInfoResponseV1";
import { OAuthService } from "../oauth/o-auth.service";
import { Builder } from "builder-pattern";
import { CreateSessionWithEmailDTO } from "./dto/CreateSessionWithEmailDTO";
import { UniversityService } from "../../university/university.service";

@ApiHeader({
  name: "Client-Version",
  description: "클라이언트 버전",
})
@Controller("signup")
export class SignupController {
  constructor(
    private signupService: SignupService,
    private universityService: UniversityService,
    private oauthService: OAuthService
  ) {}

  @Post("v1/session")
  async createSessionByUniv(
    @Body() requestV1: CreateSignupSessionRequestV1
  ): Promise<CreateSignupSessionResponseV1> {
    const identifier = await this.oauthService.getProviderSideIdentifier(
      requestV1.oauthInfo
    );

    const univ = await this.universityService.getUniversityById(
      requestV1.universityId
    );

    if (!univ) {
      throw new NotFoundException("해당 대학을 찾을 수 없습니다.");
    }

    // @ 포함이면 걸러내기
    if (requestV1.email.split("@").length > 0) {
      requestV1.email = requestV1.email.split("@")[0];
    }
    requestV1.email = `${requestV1.email}@${univ.emailDomain}`;

    const emailAuthEntity = await this.signupService.createEmailAuthSession(
      Builder(CreateSessionWithEmailDTO)
        .univId(requestV1.universityId)
        .email(requestV1.email)
        .oauthProvider(requestV1.oauthInfo.provider)
        .oauthIdentifier(identifier)
        .build()
    );
    return new CreateSignupSessionResponseV1(emailAuthEntity.sessionId);
  }

  @Post("v1/session/:sId/verifyCode")
  async verifyByCode(
    @Param("sId") sessionId: string,
    @Body() requestV1: VerifyCodeRequestV1
  ): Promise<VerifyCodeResponseV1> {
    await this.signupService.verifyByCode(sessionId, requestV1.code);
    return new VerifyCodeResponseV1(sessionId);
  }

  @Post("v1/session/:sId/userInfo")
  async submitUserInfo(
    @Param("sId") sessionId: string,
    @Body() requestV1: SubmitUserInfoRequestV1
  ) {
    await this.signupService.createUserWithInfo(sessionId, requestV1);
    return new SubmitUserInfoResponseV1(sessionId);
  }
}
