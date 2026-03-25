import { EnrollmentDto } from "@enrollment/application/dto/enrollment.dto";
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

@Injectable()
export class EnrollmentService {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  async enroll(
    dto: { studentId: string; classOfferingId: string },
    baseUrl = "",
  ): Promise<EnrollmentDto> {
    const existing =
      await this.enrollmentRepository.findByStudentAndClassOffering(
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

    const created = await this.enrollmentRepository.create(enrollment!);
    return EnrollmentDto.from(created, baseUrl)!;
  }

  async cancel(id: string, baseUrl = ""): Promise<EnrollmentDto> {
    const enrollment = await this.enrollmentRepository.findById(id);

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const canceled = await this.enrollmentRepository.cancel(id);
    return EnrollmentDto.from(canceled, baseUrl)!;
  }

  async findById(id: string, baseUrl = ""): Promise<EnrollmentDto> {
    const enrollment = await this.enrollmentRepository.findById(id);

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    return EnrollmentDto.from(enrollment, baseUrl)!;
  }

  async listByClassOffering(
    classOfferingId: string,
    baseUrl = "",
  ): Promise<EnrollmentDto[]> {
    const response =
      await this.enrollmentRepository.findByClassOfferingId(classOfferingId);
    return response.map((row) => EnrollmentDto.from(row, baseUrl)!);
  }
}
