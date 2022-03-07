import { Module } from "@nestjs/common";
import { UniversityController } from "./university.controller";
import { UniversityService } from "./university.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import UniversityEntity from "./entity/university.entity";
import DormitoryEntity from "./entity/dormitory.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([UniversityEntity]),
    TypeOrmModule.forFeature([DormitoryEntity]),
  ],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [UniversityService],
})
export class UniversityModule {}
