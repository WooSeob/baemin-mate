import { OAuthProvider } from "../../interface/OAuthProvider";

export class CreateSessionWithEmailDTO {
  oauthProvider: OAuthProvider;
  oauthIdentifier: string;
  univId: number;
  email: string;
}
