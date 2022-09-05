import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  ValueTransformer,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import UniversityEntity from "../../../university/entity/university.entity";
import { BigIntTransformer } from "../../../common/BigIntTransformer";
import { OAuthProvider } from "../../interface/OAuthProvider";
import { BadRequestException } from "@nestjs/common";

export const StringBigIntTransformer: ValueTransformer = {
  to: (entityValue: number) => entityValue,
  from: (databaseValue: string): number => {
    return parseInt(databaseValue, 10);
  },
};

export enum SignUpState {
  VERIFY_CODE_SENT = "verify_code_sent",
  VERIFIED = "verified",
  USER_INFO_SUBMITTED = "user_info_submitted",
  TRIAL_OVER = "trial_over",
  INVALID = "invalid",
}

@Entity()
export class UniversityEmailAuthEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  oauthId: string;

  @Column({ nullable: false })
  oauthProvider: OAuthProvider;

  @Column({ nullable: false })
  sessionId: string;

  @Column({ nullable: false, default: SignUpState.VERIFY_CODE_SENT })
  state: SignUpState;

  @Column({
    nullable: false,
    type: "bigint",
    transformer: [StringBigIntTransformer],
  })
  expiresIn: number;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  universityId: number;

  @Column({ nullable: false })
  authCode: string;

  @Column({ nullable: false, default: 0 })
  tryCount: number;

  @Column({
    nullable: false,
    type: "bigint",
    transformer: [StringBigIntTransformer],
  })
  updatedAt: number;

  @CreateDateColumn({ transformer: [BigIntTransformer] })
  createdAt: number;

  @ManyToOne(() => UniversityEntity, { onDelete: "NO ACTION" })
  @JoinColumn()
  university: UniversityEntity;

  @Column({ nullable: true })
  nickname: string;

  constructor() {
    this.updatedAt = Date.now();
    this.tryCount = 0;
  }

  try(authCode: string) {
    if (this.tryCount > 5) {
      throw new BadRequestException(
        "시도횟수를 초과했습니다. 다음에 시도해 주세요."
      );
    }

    if (this.authCode === authCode) {
      this.state = SignUpState.VERIFIED;
      this.expiresIn = Date.now() + 1000 * 60 * 15;
    } else {
      this.tryCount++;
    }

    this.updatedAt = Date.now();
  }
}
