import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsUUID } from "class-validator";
import type { Enrollment } from "@enrollment/domain/models/enrollment.entity";

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsUUID('4')
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsUUID('4')
  @IsNotEmpty()
  classOfferingId!: string;
}

export class HateoasLink {
  @ApiProperty({ example: "http://localhost:3001/enrollments/uuid" })
  href: string;

  @ApiProperty({ example: "GET" })
  method: string;

  constructor(href: string, method: string) {
    this.href = href;
    this.method = method;
  }
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

  constructor(self: HateoasLink, student: HateoasLink, classOffering: HateoasLink, cancel?: HateoasLink) {
    this.self = self;
    this.student = student;
    this.classOffering = classOffering;
    this.cancel = cancel;
  }
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
  ): EnrollmentDto | null {
    if (!enrollment) return null;

    const selfHref = `/v1/enrollments/${enrollment.id}`;
    const isActive = enrollment.status === "active";
    const selfLink = new HateoasLink(selfHref, "GET");
    const studentLink = new HateoasLink(`/v1/students/${enrollment.studentId}`, "GET");
    const classOfferingLink = new HateoasLink(`/v1/class-offerings/${enrollment.classOfferingId}`, "GET");
    const cancelLink = isActive ? new HateoasLink(selfHref, "DELETE") : undefined;

    const links = new EnrollmentLinks(selfLink, studentLink, classOfferingLink, cancelLink);

    return new EnrollmentDto(
      enrollment.id,
      enrollment.studentId,
      enrollment.classOfferingId,
      enrollment.status,
      enrollment.enrolledAt,
      enrollment.canceledAt,
      links,
    );
  }
}

