import { HttpException, HttpStatus } from "@nestjs/common";
import { RoomState } from "../const/RoomState";

// 공용 00
export class NotAllowedPhaseException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_00_01",
        message: "현재 단계에서 할 수 없는 작업입니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class CantChangePhaseException extends HttpException {
  constructor(from: RoomState, to: RoomState, reason?: string) {
    super(
      {
        errorCode: "R_00_02",
        message: reason ? reason : "방의 상태를 변경할 수 없습니다.",
        from: from,
        to: to,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// 생성 01

// 참가 02
export class InProgressRoomJoinNotAllowedException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_02_01",
        message: "이미 진행중인 방입니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class BannedUserJoinNotAllowedException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_02_02",
        message: "강제퇴장 당한 이용자 입니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class AlreadyJoinedException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_02_03",
        message: "이미 입장한 방입니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class AnotherUnivJoinNotAllowedException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_02_04",
        message: "다른 대학의 방에는 참여할 수 없습니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// 참여 & 생성 공용 03
export class AlreadyReadyRoomExistException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_03_01",
        message: "이미 준비완료한 방이 존재합니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class AlreadyInProgressRoomJoinedException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_03_02",
        message: "이미 진행중인 방에 참여하고 있습니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// 퇴장 04
export class PurchaserCantLeaveException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_04_01",
        message: "참여자가 있기 때문에 나갈 수 없습니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class CantLeaveBcsReadyException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_04_02",
        message: "준비 완료 상태에선 퇴장할 수 없습니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// 강퇴 05
export class KickPurchaserNotAllowedException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_05_01",
        message: "방장은 강퇴할 수 없습니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class KickAtAfterFixNotAllowedException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_05_02",
        message: "강제퇴장은 주문확정 전에만 할 수 있습니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// fix 06

// check 07
export class OrderCheckScreenShotNotFoundException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_07_01",
        message: "인증 스크린샷이 없습니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// done 08

// vote 09
export class FinishedVoteException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_09_01",
        message: "종료된 투표입니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class AlreadyDoVoteException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_09_02",
        message: "이미 투표하셨습니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class KickVoteNotAllowedUnderThreeException extends HttpException {
  constructor() {
    super(
      {
        errorCode: "R_09_03",
        message: "강퇴 투표는 3명 이상일 때 가능합니다.",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}
