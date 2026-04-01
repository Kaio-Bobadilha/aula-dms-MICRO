# Swagger — Microserviço de Matrícula

O Swagger gera a documentação interativa da API automaticamente a partir dos decorators existentes nos controllers e DTOs. A UI fica disponível em `/docs` após subir a aplicação.

## Como funciona neste projeto

```
DTOs              → @ApiProperty         → descreve os campos de cada schema
                  → @ApiPropertyOptional → campos opcionais/nullable
Controllers       → @ApiTags             → agrupa endpoints sob "enrollments"
                  → @ApiOperation        → descreve cada endpoint
                  → @ApiParam            → documenta parâmetros de rota
                  → @ApiBody             → documenta o body do POST inline
                  → @ApiResponse         → documenta os status codes e tipos
main.ts           → SwaggerModule        → monta e serve a documentação
```

---

## Instalação

```bash
npm install @nestjs/swagger
```

---

## Configuração global — `main.ts`

```typescript
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Matrícula API")
    .setDescription("Microserviço de matrícula de alunos em turmas")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document); // UI em /docs

  await app.listen(process.env.PORT!);
}
```

| Método | Descrição |
| --- | --- |
| `setTitle` | Título exibido no topo da UI |
| `setDescription` | Descrição geral do microserviço |
| `setVersion` | Versão exibida na UI |
| `SwaggerModule.setup` | Define a rota onde a UI será servida |

---

## DTOs — `@ApiProperty` e `@ApiPropertyOptional`

Cada campo dos DTOs precisa de `@ApiProperty` para aparecer no schema do Swagger.

### DTO de response — `EnrollmentDto`

O `EnrollmentDto` usa construtor privado com `static from`. Para que o Swagger consiga ler os metadados, as propriedades são declaradas como campos públicos da classe:

```typescript
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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

  // construtor privado e static from permanecem iguais
  private constructor(...) { ... }

  static from(enrollment: Enrollment | null, baseUrl = ""): EnrollmentDto | null { ... }
}
```

### Campos especiais utilizados

```typescript
// Enum inline (sem enum TypeScript, direto no decorator)
@ApiProperty({ example: "active", enum: ["active", "canceled"] })
status: string;

// Campo opcional nos links HATEOAS — só aparece quando a matrícula está ativa
@ApiPropertyOptional({ type: HateoasLink })
cancel?: HateoasLink;

// Campo nullable
@ApiPropertyOptional({ nullable: true })
canceledAt: Date | null | undefined;

// Tipo aninhado (classe como tipo)
@ApiProperty({ type: EnrollmentLinks })
_links: EnrollmentLinks;
```

> `@ApiPropertyOptional` é equivalente a `@ApiProperty({ required: false })` — usado para campos que podem não estar presentes na resposta.

---

## Controller — `EnrollmentsController`

### Agrupamento

```typescript
import { ApiTags } from "@nestjs/swagger";

@ApiTags("enrollments") // agrupa na UI sob "enrollments"
@Controller("enrollments")
export class EnrollmentsController { ... }
```

> Este microserviço não utiliza autenticação JWT, portanto `@ApiBearerAuth()` não é aplicado.

### Documentar cada endpoint

```typescript
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

// GET por parâmetro de rota — lista matrículas de uma turma
@Get("class-offering/:classOfferingId")
@ApiOperation({ summary: "Listar matrículas de uma turma" })
@ApiParam({ name: "classOfferingId", type: "string" })
@ApiResponse({ status: 200, description: "Lista de matrículas com HATEOAS" })
async findByClassOffering(...) { ... }

// GET por ID
@Get(":id")
@ApiOperation({ summary: "Buscar matrícula por ID" })
@ApiParam({ name: "id", type: "string" })
@ApiResponse({ status: 200, type: EnrollmentDto })
@ApiResponse({ status: 404, description: "Matrícula não encontrada" })
async findById(...) { ... }

// POST — body inline com @ApiBody
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
async enroll(...) { ... }

// DELETE — cancela a matrícula
@Delete(":id")
@ApiOperation({ summary: "Cancelar matrícula" })
@ApiParam({ name: "id", type: "string" })
@ApiResponse({ status: 200, type: EnrollmentDto })
@ApiResponse({ status: 404, description: "Matrícula não encontrada" })
async cancel(...) { ... }
```

### Decorators utilizados

| Decorator | Descrição |
| --- | --- |
| `@ApiTags` | Agrupa os endpoints na UI sob um nome |
| `@ApiOperation` | Descreve o propósito de cada endpoint |
| `@ApiParam` | Documenta parâmetros de rota (`:id`, `:classOfferingId`) |
| `@ApiBody` | Documenta o body do POST com schema inline |
| `@ApiResponse` | Documenta os status codes e tipos de retorno |

### Decorators de resposta utilizados

| Decorator / status | Quando |
| --- | --- |
| `@ApiResponse({ status: 200 })` | GET com retorno de dados |
| `@ApiResponse({ status: 201 })` | POST com matrícula criada |
| `@ApiResponse({ status: 404 })` | Recurso não encontrado |
| `@ApiResponse({ status: 409 })` | Conflito — aluno já matriculado |

---

## Regras aplicadas

- `@ApiProperty()` em **todos** os campos dos DTOs de response — campos sem o decorator não aparecem no schema
- `@ApiPropertyOptional()` nos campos opcionais — equivale a `@ApiProperty({ required: false })`
- DTOs com construtor privado declaram as propriedades como **campos públicos da classe** para que o Swagger leia os metadados
- `@ApiParam` é necessário para parâmetros de rota aparecerem como campos preenchíveis na UI
- `@ApiBody` com `schema` inline é usado quando o body não tem um DTO dedicado
- `@ApiTags` usa o mesmo nome do `@Controller` para manter consistência
- Classes aninhadas nos DTOs (`HateoasLink`, `EnrollmentLinks`) também recebem `@ApiProperty` em todos os seus campos
