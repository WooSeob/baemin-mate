import { Entity, Column, PrimaryGeneratedColumn, Timestamp } from "typeorm";

@Entity()
export class EmailAuth {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({
    nullable: false,
  })
  userid: string;

  @Column({
    nullable: false,
  })
  authCode: string;

  @Column({
    nullable: false,
    type: "bigint",
  })
  createdAt: number;
}
