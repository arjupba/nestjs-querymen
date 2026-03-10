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

const DEFAULT_QUERY_FIELDS = new Set(["limit", "page", "sort", "fields", "q"]);

const getSwaggerType = (value: any) => {
  if (value?.type === Number || value === Number) return Number;
  if (value?.type === Boolean || value === Boolean) return Boolean;
  if (value?.type === Date || value === Date) return Date;
  return String;
};

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

export const UseQueryMen = (schema: any, config: any = {}) => {
  const decorators: MethodDecorator[] = [
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "sort", required: false, type: String }),
    ApiQuery({ name: "fields", required: false, type: String }),
    ApiQuery({ name: "q", required: false, type: String }),
  ];

  const queryFields = schema ?? {};

  Object.entries(queryFields).forEach(([key, value]: [string, any]) => {
    if (DEFAULT_QUERY_FIELDS.has(key)) return;

    decorators.push(
      ApiQuery({
        name: key,
        required: false,
        type: getSwaggerType(value),
      }),
    );
  });

  decorators.push(UseInterceptors(QueryMenInterceptor(schema, config)));

  return applyDecorators(...decorators);
};

export const QueryMen = createParamDecorator(
  async (_, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    return req.querymen;
  },
);
