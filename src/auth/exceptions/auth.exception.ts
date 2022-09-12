import BusinessException from "../../common/interfaces/BusinessException";

// A : Auth
// 01 : signup

export class SessionExpiredException extends BusinessException {
  constructor() {
    super({
      errorCode: "A_01_01",
      message: [`인증 가능시간이 경과되었습니다. 처음부터 시도해 주세요.`],
    });
  }
}

export class InvalidStateException extends BusinessException {
  constructor() {
    super({
      errorCode: "A_01_02",
      message: [`올바르지 않은 접근입니다. 처음부터 다시 시도해 주세요.`],
    });
  }
}

export class WrongVerifyCodeException extends BusinessException {
  constructor(count: number) {
    super({
      errorCode: "A_01_03",
      message: [`인증번호가 일치하지 않습니다. (시도횟수 ${count}회)`],
    });
  }
}

export class VerifyTrialOverException extends BusinessException {
  constructor() {
    super({
      errorCode: "A_01_04",
      message: [`일일 인증 시도 횟수를 초과했습니다. 다음에 시도해 주세요.`],
    });
  }
}

export class DuplicatedEmailException extends BusinessException {
  constructor(email: string) {
    super({
      errorCode: "A_01_05",
      message: [`이미 ${email}로 가입한 계정이 있습니다.`],
    });
  }
}
