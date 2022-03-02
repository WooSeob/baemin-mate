import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { OAuthProvider } from "../../auth/interface/OAuthProvider";
import { User } from "./user.entity";

@Entity()
export class OAuthUser {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: false })
  provider: OAuthProvider;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;
}
