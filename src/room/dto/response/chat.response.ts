import { ChatBody, Message, SystemBody } from "./message.response";
import RoomChat from "../../entity/RoomChat";

export class SystemMessageResponse implements Message<SystemBody> {
  at: string;
  body: SystemBody;
  id: string;
  idx: number;
  type: string;
  static from(roomChat: RoomChat, body: SystemBody) {
    const m = new SystemMessageResponse();
    m.at = String(roomChat.createdAt);
    m.body = body;
    m.id = String(roomChat.id);
    m.idx = roomChat.id;
    m.type = "system";
    return m;
  }
}

export class ChatMessageResponse implements Message<ChatBody> {
  at: string;
  body: ChatBody;
  id: string;
  idx: number;
  type: string;
  static from(roomChat: RoomChat, body: ChatBody) {
    const m = new ChatMessageResponse();
    m.at = String(roomChat.createdAt);
    m.body = body;
    m.id = String(roomChat.id);
    m.idx = roomChat.id;
    m.type = "chat";
    return m;
  }
}
