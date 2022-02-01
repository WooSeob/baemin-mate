import { v4 as uuidv4 } from "uuid";
import { Room } from "../../domain/room/room";

export const SECTION = {
  NARAE: "Narae",
  HOYOEN: "Hoyoen",
  CHANGZO: "Changzo",
  BIBONG: "Bibong",
} as const;
export type SectionType = typeof SECTION[keyof typeof SECTION];
// export class User {
//   get sessionId(): string {
//     return this._sessionId;
//   }
//
//   get id(): string {
//     return this._id;
//   }
//
//   get section(): SectionType {
//     return this._section;
//   }
//
//   get mannerRate(): number {
//     return this._mannerRate;
//   }
//
//   get name(): string {
//     return this._name;
//   }
//
//   private readonly _sessionId: string;
//   private readonly _id: string;
//   private readonly _section: SectionType;
//   private readonly _name: string;
//   private _mannerRate: number;
//
//   constructor(id, section, mannerRate) {
//     this._id = id;
//     this._section = section;
//     this._mannerRate = mannerRate;
//     this._sessionId = uuidv4();
//   }
//
//   join(room: Room) {
//     this._joinRoom = room;
//   }
//   leaveRoom() {
//     this._joinRoom = null;
//   }
//   isAlreadyJoined() {
//     return this._joinRoom != null;
//   }
// }
