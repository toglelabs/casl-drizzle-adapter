# @toglelabs/casl-drizzle-adapter

A security-focused TypeScript package to convert [CASL](https://casl.js.org/) authorization rules into [Drizzle ORM](https://orm.drizzle.team/) SQL filters.

**v0.1.0**

## Purpose

This adapter allows you to automatically enforce database-level row permissions based on your logic defined in CASL abilities. It converts rules into optimized SQL filters to ensure users can only fetch data they are allowed to see.

It strictly adheres to CASL semantics:
`((ALLOW OR ALLOW) AND NOT (DENY OR DENY))`

## Installation

```bash
# npm
npm install @toglelabs/casl-drizzle-adapter

# pnpm
pnpm add @toglelabs/casl-drizzle-adapter

# yarn
yarn add @toglelabs/casl-drizzle-adapter
```

**Peer Dependencies**:
You must also install:
- `@casl/ability`
- `drizzle-orm`

## Usage

### Basic Example

```ts
import { createCaslDrizzleAdapter } from "@toglelabs/casl-drizzle-adapter";
import { defineAbility } from "@casl/ability";
import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { db } from "./db";
import { eq } from "drizzle-orm";

// 1. Define Drizzle Schema
const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  authorId: text("author_id"),
  published: boolean("published"),
});

// 2. Initialize Adapter
const adapter = createCaslDrizzleAdapter({
  table: posts,
});

// 3. Define Ability
const ability = defineAbility((can) => {
  can("read", "Post", { authorId: "user_1" });
  can("read", "Post", { published: true });
});

// 4. Generate Filter
const filter = adapter.filterFromAbility(ability, "read", "Post");
// Result: or(eq(posts.authorId, "user_1"), eq(posts.published, true))

// 5. Query
await db.select().from(posts).where(filter);
```

### Custom Operators

Extend default operators (`$eq`, `$in`) with Drizzle helpers.

```ts
import { gt } from "drizzle-orm";

const adapter = createCaslDrizzleAdapter({
  table: posts,
  operators: {
    $gt: (column, value) => gt(column, value),
  },
});
```

## Security Guarantees & Semantics

*   **Fail Closed**: Unknown columns or operators always throw errors.
*   **Permissions**: `(ALLOW_1 OR ALLOW_2) AND NOT (DENY_1 OR DENY_2)`.
*   **Precedence**: `cannot` rules always override `can` rules via `AND NOT`.

### Limitations
*   No nested logic (e.g., `$or` inside a condition).
*   No relation filtering (filtering on joined tables).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License
ISC
