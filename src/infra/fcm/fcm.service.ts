import { Injectable, Logger } from "@nestjs/common";
import * as firebaseAdmin from "firebase-admin";
import { firebaseServiceAccount } from "../../../config";

@Injectable()
// 크로스 플랫폼 대응을 위한 추상화
export class FcmService {
  private readonly logger = new Logger("FcmService");

  constructor() {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: firebaseServiceAccount.project_id,
        privateKey: firebaseServiceAccount.private_key,
        clientEmail: firebaseServiceAccount.client_email,
      }),
    });
  }

  multicastNotification(deviceTokens: string[], notification) {
    this.logger.log({ message: "MulticastNotification", notification });
    const androidFcmMessage = {
      notification: notification,
      tokens: deviceTokens,
    };

    firebaseAdmin
      .messaging()
      .sendMulticast(androidFcmMessage)
      .then((res) => {
        res.responses.forEach((response) => {});
      })
      .catch((err) => console.log(err));
  }
}
