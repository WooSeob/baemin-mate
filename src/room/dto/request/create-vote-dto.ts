export default class CreateVoteDto {
  type: "kick" | "reset";
  target_uid: string;
}
