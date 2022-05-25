import { Injectable, Logger } from "@nestjs/common";
import * as AWS from "aws-sdk";
import { aws_s3 } from "../../../config";

export interface UploadFileDto<T> {
  file: T;
  key: string;
}

enum AwsOperation {
  GET_OBJECT = "getObject",
}

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly logger = new Logger("S3Service");
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: aws_s3.accessKeyId,
      secretAccessKey: aws_s3.secretAccessKey,
      region: aws_s3.region,
    });
  }

  upload(files: UploadFileDto<Express.Multer.File>[]) {
    const promises = files.map((file) => {
      return this.s3
        .upload({
          Bucket: aws_s3.bucketName,
          Key: file.key,
          Body: file.file.buffer,
        })
        .promise();
    });

    return Promise.all(promises);
  }

  getSignedUrls(keys: string[]) {
    return keys.map((key) => {
      return this.s3.getSignedUrl(AwsOperation.GET_OBJECT, {
        Bucket: aws_s3.bucketName,
        Key: key,
      });
    });
  }
}
