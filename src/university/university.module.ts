import { Module } from "@nestjs/common";
import { UniversityController } from "./university.controller";
import { UniversityService } from "./university.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import University from "./entity/University";
import Dormitory from "./entity/Dormitory";

@Module({
  imports: [
    TypeOrmModule.forFeature([University]),
    TypeOrmModule.forFeature([Dormitory]),
  ],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [UniversityService],
})
export class UniversityModule {}
