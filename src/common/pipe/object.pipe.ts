import {
  ArgumentMetadata,
  Injectable,
  Logger,
  PipeTransform,
} from "@nestjs/common";

@Injectable()
export class ObjectPipe implements PipeTransform {
  private logger = new Logger("ObjectPipe");
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value == "string") {
      try {
        return JSON.parse(value);
      } catch (e) {
        this.logger.error(e);
      }
    }
    return value;
  }
}
