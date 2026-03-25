import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Enrollment } from "@enrollment/domain/models/enrollment.entity";

export class HateoasLink {
  @ApiProperty({ example: "http://localhost:3001/enrollments/uuid" })
  href: string;

  @ApiProperty({ example: "GET" })
  method: string;
}

export class EnrollmentLinks {
  @ApiProperty({ type: HateoasLink })
  self: HateoasLink;

  @ApiPropertyOptional({ type: HateoasLink })
  cancel?: HateoasLink;

  @ApiProperty({ type: HateoasLink })
  student: HateoasLink;

  @ApiProperty({ type: HateoasLink })
  classOffering: HateoasLink;
}

export class EnrollmentDto {
  @ApiProperty({ example: "uuid" })
  id: string | undefined;

  @ApiProperty({ example: "uuid" })
  studentId: string;

  @ApiProperty({ example: "uuid" })
  classOfferingId: string;

  @ApiProperty({ example: "active", enum: ["active", "canceled"] })
  status: string;

  @ApiProperty()
  enrolledAt: Date;

  @ApiPropertyOptional({ nullable: true })
  canceledAt: Date | null | undefined;

  @ApiProperty({ type: EnrollmentLinks })
  _links: EnrollmentLinks;

  private constructor(
    id: string | undefined,
    studentId: string,
    classOfferingId: string,
    status: string,
    enrolledAt: Date,
    canceledAt: Date | null | undefined,
    _links: EnrollmentLinks,
  ) {
    this.id = id;
    this.studentId = studentId;
    this.classOfferingId = classOfferingId;
    this.status = status;
    this.enrolledAt = enrolledAt;
    this.canceledAt = canceledAt;
    this._links = _links;
  }

  public static from(
    enrollment: Enrollment | null,
    baseUrl = "",
  ): EnrollmentDto | null {
    if (!enrollment) return null;

    const self = `${baseUrl}/enrollments/${enrollment.id}`;
    const isActive = enrollment.status === "active";

    return new EnrollmentDto(
      enrollment.id,
      enrollment.studentId,
      enrollment.classOfferingId,
      enrollment.status,
      enrollment.enrolledAt,
      enrollment.canceledAt,
      {
        self: { href: self, method: "GET" },
        ...(isActive && {
          cancel: { href: self, method: "DELETE" },
        }),
        student: {
          href: `${baseUrl}/students/${enrollment.studentId}`,
          method: "GET",
        },
        classOffering: {
          href: `${baseUrl}/class-offerings/${enrollment.classOfferingId}`,
          method: "GET",
        },
      },
    );
  }
}
