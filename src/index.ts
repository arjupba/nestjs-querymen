import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Type,
  UseInterceptors,
  applyDecorators,
  createParamDecorator,
  mixin,
} from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";
import { middleware as query } from "querymen";
import { Observable } from "rxjs";

export type QueryMenType = {
  query: any;
  select: any;
  cursor: any;
};

export function QueryMenInterceptor(
  schema: any,
  config: any,
): Type<NestInterceptor> {
  @Injectable()
  class QueryMenInterceptorMixin implements NestInterceptor {
    private readonly middleware = query(schema, config);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();

      this.middleware(req, res, (err: any) => {
        if (err) {
          if (typeof err === "string") throw new BadRequestException([err]);

          throw new BadRequestException(
            Array.isArray(err) ? err : [err?.message ?? "Invalid query"],
          );
        }
      });

      return next.handle();
    }
  }

  return mixin(QueryMenInterceptorMixin);
}

export const UseQueryMen = (schema: any, config: any = {}) =>
  applyDecorators(
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "sort", required: false, type: String }),
    ApiQuery({ name: "fields", required: false, type: String }),
    ApiQuery({ name: "q", required: false, type: String }),
    UseInterceptors(QueryMenInterceptor(schema, config)),
  );

export const QueryMen = createParamDecorator(
  async (_, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    return req.querymen;
  },
);
