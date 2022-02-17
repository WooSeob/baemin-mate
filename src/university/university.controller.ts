import { Controller, Get, Param } from "@nestjs/common";
import { UniversityService } from "./university.service";

@Controller("university")
export class UniversityController {
  constructor(private universityService: UniversityService) {}

  @Get("/")
  async getAllUniversities() {
    return this.universityService.getAllUniversities();
  }

  @Get("/:id")
  async getUniversityById(@Param("id") universityId: number) {
    return this.universityService.getUniversityById(universityId);
  }
}
