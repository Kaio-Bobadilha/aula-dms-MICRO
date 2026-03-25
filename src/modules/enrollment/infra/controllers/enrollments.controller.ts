import { EnrollmentService } from "@enrollment/application/services/enrollment.service";
import { EnrollmentDto } from "@enrollment/application/dto/enrollment.dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

@ApiTags("enrollments")
@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get("class-offering/:classOfferingId")
  @ApiOperation({ summary: "Listar matrículas de uma turma" })
  @ApiParam({ name: "classOfferingId", type: "string" })
  @ApiResponse({ status: 200, description: "Lista de matrículas com HATEOAS" })
  async findByClassOffering(
    @Param("classOfferingId") classOfferingId: string,
    @Req() req: Request,
  ) {
    const enrollments = await this.enrollmentService.listByClassOffering(
      classOfferingId,
      this.baseUrl(req),
    );

    return {
      _links: {
        self: {
          href: `${this.baseUrl(req)}/enrollments/class-offering/${classOfferingId}`,
          method: "GET",
        },
        create: { href: `${this.baseUrl(req)}/enrollments`, method: "POST" },
      },
      count: enrollments.length,
      enrollments,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar matrícula por ID" })
  @ApiParam({ name: "id", type: "string" })
  @ApiResponse({ status: 200, type: EnrollmentDto })
  @ApiResponse({ status: 404, description: "Matrícula não encontrada" })
  async findById(@Param("id") id: string, @Req() req: Request) {
    return this.enrollmentService.findById(id, this.baseUrl(req));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Matricular aluno em uma turma" })
  @ApiBody({
    schema: {
      properties: {
        studentId: { type: "string", example: "uuid" },
        classOfferingId: { type: "string", example: "uuid" },
      },
      required: ["studentId", "classOfferingId"],
    },
  })
  @ApiResponse({ status: 201, type: EnrollmentDto })
  @ApiResponse({ status: 409, description: "Aluno já matriculado nesta turma" })
  async enroll(
    @Body() body: { studentId: string; classOfferingId: string },
    @Req() req: Request,
  ) {
    return this.enrollmentService.enroll(body, this.baseUrl(req));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancelar matrícula" })
  @ApiParam({ name: "id", type: "string" })
  @ApiResponse({ status: 200, type: EnrollmentDto })
  @ApiResponse({ status: 404, description: "Matrícula não encontrada" })
  async cancel(@Param("id") id: string, @Req() req: Request) {
    return this.enrollmentService.cancel(id, this.baseUrl(req));
  }

  private baseUrl(req: Request): string {
    return `${req.protocol}://${req.get("host")}`;
  }
}
