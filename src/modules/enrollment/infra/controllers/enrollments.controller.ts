import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { EnrollmentService } from "@enrollment/application/services/enrollment.service";
import { CreateEnrollmentDto } from "@enrollment/application/dto/enrollment.dto";
import { HateoasItem, HateoasList } from "@shared/infra/hateoas";
import type { Enrollment } from "@enrollment/domain/models/enrollment.entity";

@ApiTags("enrollments")
@ApiBearerAuth()
@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

@Get()
  @HateoasList<Enrollment>({
    basePath: "/v1/enrollments",
    itemLinks: (item) => ({
      self: { href: `/v1/enrollments/${item.id}`, method: "GET" },
      cancel: item.status === "active" ? { href: `/v1/enrollments/${item.id}/cancel`, method: "PATCH" } : null,
      student: { href: `/v1/students/${item.studentId}`, method: "GET" },
      classOffering: { href: `/v1/class-offerings/${item.classOfferingId}`, method: "GET" },
    }),
  })
  @ApiOperation({ summary: "Listar matrículas" })
  @ApiQuery({ name: "class_offering_id", required: false, type: String })
  @ApiQuery({ name: "_page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "_size", required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: "Lista paginada de matrículas com HATEOAS" })
  @ApiBadRequestResponse({ description: "Parâmetros inválidos" })
  @ApiUnauthorizedResponse({ description: "Acesso não autorizado" })
  async findAll(
    @Query("class_offering_id") classOfferingId?: string,
    @Query("_page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("_size", new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.enrollmentService.listPaginated({ classOfferingId, page, limit });
  }

  @Get(":id")
  @HateoasItem<Enrollment>({
    basePath: "/v1/enrollments",
    itemLinks: (item) => ({
      self: { href: `/v1/enrollments/${item.id}`, method: "GET" },
      list: { href: "/v1/enrollments", method: "GET" },
      cancel: item.status === "active" ? { href: `/v1/enrollments/${item.id}/cancel`, method: "PATCH" } : null,
      student: { href: `/v1/students/${item.studentId}`, method: "GET" },
      classOffering: { href: `/v1/class-offerings/${item.classOfferingId}`, method: "GET" },
    }),
  })
  @ApiOperation({ summary: "Buscar matrícula por ID" })
  @ApiParam({ name: "id", type: String })
  @ApiOkResponse({ description: "Matrícula encontrada com HATEOAS" })
  @ApiNotFoundResponse({ description: "Matrícula não encontrada" })
  @ApiUnauthorizedResponse({ description: "Acesso não autorizado" })
  async findById(@Param("id") id: string) {
    return this.enrollmentService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: "Matricular aluno em uma turma" })
  @ApiCreatedResponse({ description: "Matrícula criada com sucesso" })
  @ApiConflictResponse({ description: "Aluno já matriculado nesta turma" })
  @ApiNotFoundResponse({ description: "Aluno ou turma não encontrados" })
  @ApiBadRequestResponse({ description: "Dados inválidos" })
  async enroll(@Body() body: CreateEnrollmentDto) {
    return this.enrollmentService.enroll(body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancelar matrícula" })
  @ApiParam({ name: "id", type: String })
  @ApiNoContentResponse({ description: "Matrícula cancelada" })
  @ApiNotFoundResponse({ description: "Matrícula não encontrada" })
  @ApiUnauthorizedResponse({ description: "Acesso não autorizado" })
  async delete(@Param("id") id: string) {
    await this.enrollmentService.cancel(id);
  }

  @Patch(":id/cancel")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancelar matrícula (ação descritiva)" })
  @ApiParam({ name: "id", type: String })
  @ApiNoContentResponse({ description: "Matrícula cancelada" })
  @ApiNotFoundResponse({ description: "Matrícula não encontrada" })
  @ApiUnauthorizedResponse({ description: "Acesso não autorizado" })
  async cancel(@Param("id") id: string) {
    await this.enrollmentService.cancel(id);
  }
}

