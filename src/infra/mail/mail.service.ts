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
      html: `<h1>${authCode}</h1>`,
    });
  }
}
