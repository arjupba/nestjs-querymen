# nestjs-querymen

NestJS wrapper for `querymen` (see `https://github.com/diegohaz/querymen`).

## Install

```bash
npm install nestjs-querymen querymen
```

## Usage

```ts
import { Controller, Get } from "@nestjs/common";
import { UseQueryMen, QueryMen, type QueryMenType } from "nestjs-querymen";

const schema = {
  sort: { default: '-createdAt' },
  page: { default: 1, min: 1, max: 1000 },
  limit: { default: 10, min: 1, max: 100 },
};

@Controller("users")
export class UsersController {
  @Get()
  @UseQueryMen(schema)
  findAll(@QueryMen() q: QueryMenType) {
    // q.query  -> filters
    // q.select -> fields projection
    // q.cursor -> pagination/sort info
    return q;
  }
}
```

## Exports

- `UseQueryMen(schema, config?)`: adds Swagger query params and the interceptor.
- `QueryMen()`: injects `req.querymen` into your handler.
