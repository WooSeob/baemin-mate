import { ConflictException } from "@nestjs/common";

export default abstract class BusinessException extends ConflictException {
  protected constructor(
    response: BusinessExceptionResponse,
    description?: string
  ) {
    super(response, description);
  }
}

export interface BusinessExceptionResponse {
  errorCode: string;
  message: string[];
}
