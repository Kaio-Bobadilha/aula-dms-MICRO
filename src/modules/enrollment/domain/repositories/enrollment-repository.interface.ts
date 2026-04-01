import type { Enrollment } from "@enrollment/domain/models/enrollment.entity";

export const ENROLLMENT_REPOSITORY = Symbol("ENROLLMENT_REPOSITORY");

export interface EnrollmentRepository {
  create(enrollment: Enrollment): Promise<Enrollment>;
  cancel(id: string): Promise<Enrollment>;
  findById(id: string): Promise<Enrollment | null>;
  findByClassOfferingId(classOfferingId: string): Promise<Enrollment[]>;
  findByStudentAndClassOffering(
    studentId: string,
    classOfferingId: string,
  ): Promise<Enrollment | null>;
  // Pagination
  findPaginatedByClassOfferingId(
    classOfferingId: string,
    page: number,
    limit: number,
  ): Promise<Enrollment[]>;
  countByClassOfferingId(classOfferingId: string): Promise<number>;
}

