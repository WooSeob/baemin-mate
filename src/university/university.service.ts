import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import University from "./entity/University";
import { Repository } from "typeorm";
import Dormitory from "./entity/Dormitory";

@Injectable()
export class UniversityService {
  constructor(
    @InjectRepository(University)
    private universityRepository: Repository<University>,
    @InjectRepository(Dormitory)
    private dormitoryRepository: Repository<Dormitory>
  ) {}

  async getAllUniversities(): Promise<University[]> {
    return this.universityRepository.find();
  }

  async getDormitoryById(id: number): Promise<Dormitory> {
    return this.dormitoryRepository.findOne(id);
  }

  async getDormitoriesByUnivId(id: number): Promise<University> {
    return this.universityRepository.findOne(id, {
      relations: ["dormitories"],
    });
  }

  async getUniversityById(id: number): Promise<University> {
    return this.universityRepository.findOne(id);
  }

  async getUniversityByKorName(korName: string): Promise<University> {
    return this.universityRepository.findOne(
      { korName: korName },
      { relations: ["dormitories"] }
    );
  }
}
