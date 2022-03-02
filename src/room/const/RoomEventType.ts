export enum RoomEventType {
  CREATE = "create",
  DELETED = "delete",
  MENU_UPDATE = "menuUpdate",
  USER_ENTER = "userJoin",

  USER_LEAVE = "userLeave",
  USER_KICKED = "userKicked",
  USER_KICKED_BY_VOTE = "userKickedByVote",

  ALL_READY = "allReady",
  ALL_READY_CANCELED = "allReadyCanceled",
  ORDER_FIXED = "orderFix",
  ORDER_CHECKED = "orderCheck",
  ORDER_DONE = "orderDone",
  ORDER_CANCELED = "orderCancel",
  KICK_VOTE_CREATED = "kickVoteCreated",
  KICK_VOTE_FINISHED = "kickVoteFinished",
  RESET_VOTE_CREATED = "resetVoteCreated",
  RESET_VOTE_FINISHED = "resetVoteFinished",
  CHAT = "chat",
}
