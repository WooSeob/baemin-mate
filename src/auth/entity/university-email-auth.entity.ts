import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  ValueTransformer,
  CreateDateColumn,
} from "typeorm";
import UniversityEntity from "../../university/entity/university.entity";
import { BigIntTransformer } from "../../common/BigIntTransformer";

export const StringBigIntTransformer: ValueTransformer = {
  to: (entityValue: number) => entityValue,
  from: (databaseValue: string): number => {
    return parseInt(databaseValue, 10);
  },
};

@Entity()
export class UniversityEmailAuthEntity {
  @PrimaryColumn()
  oauthId: string;

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
  firstTrailAt: number;

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

  static create(
    univId: number,
    oauthId: string,
    email: string
  ): UniversityEmailAuthEntity {
    const instance = new UniversityEmailAuthEntity();
    instance.universityId = univId;
    instance.oauthId = oauthId;
    instance.email = email;
    instance.tryCount = 0;
    return instance;
  }

  constructor() {
    this.firstTrailAt = Date.now();
    this.updatedAt = Date.now();
  }

  try(univId: number, email: string, authCode: string) {
    this.universityId = univId;
    this.email = email;
    this.authCode = authCode;

    this.tryCount++;

    const now = Date.now();
    this.updatedAt = now;
    if (this._shouldChangeFirstTrailAt()) {
      this.firstTrailAt = now;
    }
  }

  isNotAvailable() {
    return this._isIn24HourFromFirstTrial() && this._isOverMaxTrial();
  }

  private _isIn24HourFromFirstTrial() {
    const DAY_MILLI = 1000 * 60 * 60 * 24;
    const elapsedTimeMilli = Math.abs(Date.now() - this.firstTrailAt);
    return elapsedTimeMilli < DAY_MILLI;
  }

  private _isOverMaxTrial() {
    return (this.tryCount - 1) % 5 == 4;
  }

  private _shouldChangeFirstTrailAt() {
    return (this.tryCount - 1) % 5 == 0;
  }
}
