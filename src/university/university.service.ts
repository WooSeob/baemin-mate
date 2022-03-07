import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import UniversityEntity from "./entity/university.entity";
import { Repository } from "typeorm";
import DormitoryEntity from "./entity/dormitory.entity";

@Injectable()
export class UniversityService {
  constructor(
    @InjectRepository(UniversityEntity)
    private universityRepository: Repository<UniversityEntity>,
    @InjectRepository(DormitoryEntity)
    private dormitoryRepository: Repository<DormitoryEntity>
  ) {}

  async getAllUniversities(): Promise<UniversityEntity[]> {
    return this.universityRepository.find();
  }

  async getDormitoryById(id: number): Promise<DormitoryEntity> {
    return this.dormitoryRepository.findOne(id);
  }

  async getDormitoriesByUnivId(id: number): Promise<UniversityEntity> {
    return this.universityRepository.findOne(id, {
      relations: ["dormitories"],
    });
  }

  async getUniversityById(id: number): Promise<UniversityEntity> {
    return this.universityRepository.findOne(id);
  }

  async getUniversityByKorName(korName: string): Promise<UniversityEntity> {
    return this.universityRepository.findOne(
      { korName: korName },
      { relations: ["dormitories"] }
    );
  }
}
