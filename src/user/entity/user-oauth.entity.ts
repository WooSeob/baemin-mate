import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { OAuthProvider } from "../../auth/interface/OAuthProvider";
import { UserEntity } from "./user.entity";

@Entity()
export class UserOauthEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: false })
  provider: OAuthProvider;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn()
  user: UserEntity;
}
