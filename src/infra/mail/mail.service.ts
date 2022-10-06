import { Injectable } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer";
import { EmailAuthConfig } from "../../../config";

@Injectable()
export class MailService {
  private readonly _mailTransporter: Transporter;

  constructor() {
    this._mailTransporter = createTransport(EmailAuthConfig.getAccount());
  }

  public async sendSignupVerifyEmail(to: string, authCode: string) {
    await this._mailTransporter.sendMail({
      // 보내는 곳의 이름과, 메일 주소를 입력
      from: EmailAuthConfig.content.from,
      // 받는 곳의 메일 주소를 입력
      to: to,
      // 보내는 메일의 제목을 입력
      subject: EmailAuthConfig.content.subject,
      // 보내는 메일의 내용을 입력
      text: authCode,

      html: `
<h1>이메일 인증</h1>
<p>안녕하세요.</P>
<p>같이하실에 회원가입을 해주셔서 감사합니다.</P>
<p>아래의 인증코드를 입력하여 회원가입을 완료해주세요.</P>
<div style="background-color:rgba(128, 128, 128, 0.3); border-radius: 8px; text-align: center; width: 300px;  padding: 20px 0"> <h1>${authCode}</h1> </div>`,
      
    });
  }
}
