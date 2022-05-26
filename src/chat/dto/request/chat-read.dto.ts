import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsUUID } from "class-validator";

export default class ChatReadDto {
    @ApiProperty()
    @IsString()
    @IsUUID(4)
    roomId: string;

    @ApiProperty()
    @IsNumber()
    messageId: number;
}
