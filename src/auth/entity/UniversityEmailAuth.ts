import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import University from "../../university/entity/University";
import { BigIntTransformer } from "../../common/BigIntTransformer";

@Entity()
export class UniversityEmailAuth {
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
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  firstTrailAt: number;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  updatedAt: number;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  createdAt: number;

  @ManyToOne(() => University, { onDelete: "NO ACTION" })
  @JoinColumn()
  university: University;

  static create(
    univId: number,
    oauthId: string,
    email: string
  ): UniversityEmailAuth {
    const instance = new UniversityEmailAuth();
    instance.universityId = univId;
    instance.oauthId = oauthId;
    instance.email = email;
    instance.tryCount = 0;
    return instance;
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
