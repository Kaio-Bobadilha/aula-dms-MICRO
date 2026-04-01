import { CreateEnrollmentDto } from "@enrollment/application/dto/enrollment.dto";
import {
  Enrollment,
  EnrollmentStatus,
} from "@enrollment/domain/models/enrollment.entity";
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from "@enrollment/domain/repositories/enrollment-repository.interface";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { PaginatedResult } from "@shared/infra/hateoas";

interface ListParams {
  classOfferingId?: string;
  page: number;
  limit: number;
}

@Injectable()
export class EnrollmentService {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  async listPaginated(params: ListParams): Promise<PaginatedResult<Enrollment>> {
    const { classOfferingId, page, limit } = params;

    if (!classOfferingId) {
      const data: Enrollment[] = [];
      const total = 0;
      return { data, total, page, limit };
    }

    const data = await this.enrollmentRepository.findPaginatedByClassOfferingId(classOfferingId, page, limit);
    const total = await this.enrollmentRepository.countByClassOfferingId(classOfferingId);
    return { data, total, page, limit };
  }

  async enroll(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const existing = await this.enrollmentRepository.findByStudentAndClassOffering(
      dto.studentId,
      dto.classOfferingId,
    );

    if (existing) {
      throw new ConflictException(
        "Student is already enrolled in this class offering",
      );
    }

    const enrollment = Enrollment.restore({
      studentId: dto.studentId,
      classOfferingId: dto.classOfferingId,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: new Date(),
    });

    return await this.enrollmentRepository.create(enrollment!);
  }

  async cancel(id: string): Promise<void> {
    const enrollment = await this.enrollmentRepository.findById(id);

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    await this.enrollmentRepository.cancel(id);
  }

  async findById(id: string): Promise<Enrollment | null> {
    const enrollment = await this.enrollmentRepository.findById(id);

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    return enrollment;
  }
}

