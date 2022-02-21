import { Controller, Get, Param } from "@nestjs/common";
import { UniversityService } from "./university.service";
import { ApiCreatedResponse } from "@nestjs/swagger";
import { UniversityResponse } from "./dto/response/university.response";
import { DormitoryResponse } from "./dto/response/dormitory.response";

@Controller("university")
export class UniversityController {
  constructor(private universityService: UniversityService) {}

  @ApiCreatedResponse({
    description: "모든 대학들의 정보를 반환합니다.",
    type: [UniversityResponse],
  })
  @Get("/")
  async getAllUniversities(): Promise<UniversityResponse[]> {
    return this.universityService.getAllUniversities();
  }

  @ApiCreatedResponse({
    description: "특정 대학의 정보를 반환합니다.",
    type: UniversityResponse,
  })
  @Get("/:id")
  async getUniversityById(
    @Param("id") universityId: number
  ): Promise<UniversityResponse> {
    return this.universityService.getUniversityById(universityId);
  }

  @Get("/:id/dormitory")
  @ApiCreatedResponse({
    description: "특정 대학의 기숙사 목록을 반환합니다.",
    type: [DormitoryResponse],
  })
  async getDormitories(
    @Param("id") universityId: number
  ): Promise<DormitoryResponse[]> {
    return (await this.universityService.getDormitoriesByUnivId(universityId))
      .dormitories;
  }
}
