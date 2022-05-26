import { ApiProperty } from "@nestjs/swagger";
import UserChatMetadataEntity from "../../entity/user-chat-metadata.entity";

export class ChatReadsIdDto {
    @ApiProperty({ description: "방 아이디" })
    roomId: string;

    @ApiProperty({ description: "읽은 메시지 id 목록" })
    messageIds: ChatReadIdDto[];
}

export default class ChatReadIdDto {
    @ApiProperty({ description: "유저 아이디" })
    userId: string;

    @ApiProperty({ description: "최근 확인한 메시지 id" })
    messageId: number;

    static fromUserChatMetadata(
        userChatMetadata: UserChatMetadataEntity
    ): ChatReadIdDto {
        const instance = new ChatReadIdDto();
        instance.userId = userChatMetadata.userId;
        instance.messageId = userChatMetadata.readToId;
        return instance;
    }
}
