import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { PaginatedResult } from "./hateoas.types";
import { HATEOAS_ITEM_KEY, type HateoasItemOptions } from "./hateoas-item.decorator";
import { HATEOAS_LIST_KEY, type HateoasListOptions } from "./hateoas-list.decorator";

@Injectable()
export class HateoasInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const listOptions = this.reflector.get<HateoasListOptions>(
      HATEOAS_LIST_KEY,
      context.getHandler(),
    );
    const itemOptions = this.reflector.get<HateoasItemOptions>(
      HATEOAS_ITEM_KEY,
      context.getHandler(),
    );

    if (!listOptions && !itemOptions) {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<{ query: Record<string, string> }>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (listOptions) {
          return this.transformList(
            data as PaginatedResult<Record<string, unknown>>,
            listOptions,
            request.query,
          );
        }
        return this.transformItem(
          data as Record<string, unknown> | null,
          itemOptions!,
        );
      }),
    );
  }

  private transformList(
    paginated: PaginatedResult<Record<string, unknown>>,
    options: HateoasListOptions,
    query: Record<string, string>,
  ) {
    const { data, total, page, limit } = paginated;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    const { basePath } = options;
    const queryString = new URLSearchParams(query).toString();
    const fullPath = queryString ? `${basePath}?${queryString}` : basePath;

    const itemsWithLinks = data.map((item) => ({
      ...item,
      _links: options.itemLinks(item),
    }));

    return {
      data: itemsWithLinks,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
      },
      _links: {
        self: { href: fullPath, method: "GET" },
        next: page < totalPages
          ? {
              href: `${basePath}?${new URLSearchParams({ ...query, _page: (page + 1).toString() }).toString()}`,
              method: "GET"
            }
          : null,
        prev: page > 1
          ? {
              href: `${basePath}?${new URLSearchParams({ ...query, _page: (page - 1).toString() }).toString()}`,
              method: "GET"
            }
          : null,
        first: {
            href: `${basePath}?${new URLSearchParams({ ...query, _page: '1' }).toString()}`,
            method: "GET"
          },
        last: {
            href: `${basePath}?${new URLSearchParams({ ...query, _page: totalPages.toString() }).toString()}`,
            method: "GET"
          },
        create: { href: basePath, method: "POST" },
      },
    };
  }

  private transformItem(
    item: Record<string, unknown> | null,
    options: HateoasItemOptions,
  ) {
    if (!item) return null;
    return {
      ...item,
      _links: options.itemLinks(item),
    };
  }
}

