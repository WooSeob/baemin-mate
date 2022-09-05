export default abstract class CommonResponseV1 {
  sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }
}
