import { Module } from "@nestjs/common";
import { UniversityController } from "./university.controller";
import { UniversityService } from "./university.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import University from "./entity/University";

@Module({
  imports: [TypeOrmModule.forFeature([University])],
  controllers: [UniversityController],
  providers: [UniversityService],
})
export class UniversityModule {}
