import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import University from "./entity/University";
import { Repository } from "typeorm";

@Injectable()
export class UniversityService {
  constructor(
    @InjectRepository(University)
    private universityRepository: Repository<University>
  ) {}

  async getAllUniversities(): Promise<University[]> {
    return this.universityRepository.find();
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
