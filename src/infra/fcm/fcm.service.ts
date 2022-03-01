import { Injectable } from "@nestjs/common";
import * as firebaseAdmin from "firebase-admin";
import { firebaseServiceAccount } from "../../../config";

@Injectable()
// 크로스 플랫폼 대응을 위한 추상화
export class FcmService {
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
    console.log(notification);
    const androidFcmMessage = {
      notification: notification,
      tokens: deviceTokens,
    };

    firebaseAdmin
      .messaging()
      .sendMulticast(androidFcmMessage)
      .then((res) => {
        console.log(res);
        res.responses.forEach((response) => {
          console.log(response);
        });
      })
      .catch((err) => console.log(err));
  }
}
