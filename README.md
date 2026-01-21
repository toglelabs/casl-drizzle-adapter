# casl-drizzle-adapter

A security-focused TypeScript package to convert [CASL](https://casl.js.org/) authorization rules into [Drizzle ORM](https://orm.drizzle.team/) SQL filters.

**v0.1.0**

## Purpose

This adapter allows you to automatically enforce database-level row permissions based on your logic defined in CASL abilities. It converts rules into optimized SQL filters to ensure users can only fetch data they are allowed to see.

It strictly adheres to CASL semantics:
`((ALLOW OR ALLOW) AND NOT (DENY OR DENY))`

## Installation

```bash
npm install casl-drizzle-adapter @casl/ability drizzle-orm
```

## Usage

### Basic Example

```ts
import { createCaslDrizzleAdapter } from "casl-drizzle-adapter";
import { defineAbility } from "@casl/ability";
import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { db } from "./db"; // Your drizzle db instance, e.g. NodePgDatabase
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

// 3. Define Ability (e.g., for a user)
const ability = defineAbility((can) => {
  // User can read their own posts
  can("read", "Post", { authorId: "user_1" });
  // OR public posts
  can("read", "Post", { published: true });
});

// 4. Generate Filter
const filter = adapter.filterFromAbility(ability, "read", "Post");
// Result is equivalent to:
// or(
//   eq(posts.authorId, "user_1"),
//   eq(posts.published, true)
// )

// 5. Query
await db.select().from(posts).where(filter);
```

### Custom Operators

The adapter ships with `$eq` (default) and `$in`. You can extend it with custom operators using Drizzle's helpers.

```ts
import { gt } from "drizzle-orm";

const adapter = createCaslDrizzleAdapter({
  table: posts,
  operators: {
    $gt: (column, value) => gt(column, value), // Map CASL $gt to Drizzle gt()
  },
});

// Now you can use { views: { $gt: 10 } } in your CASL rules.
```

## Semantics & Security

The adapter implements permissions with the following strict logic:
```
(ALLOW_RULE_1 OR ALLOW_RULE_2 OR ...)
AND NOT
(DENY_RULE_1 OR DENY_RULE_2 OR ...)
```

- **Fail Closed**: Unknown columns or operators throw explicit errors.
- **No Rules**: Returns `null` (allow all). Ensure your CASL ability logic handles "default deny" if that is your intent (typically by not having a "catch-all" allow rule). Wait, **correction**: In CASL, if you have NO rules for a subject, you cannot read it. However, `filterFromRules` takes a LIST of rules.
    - If `can` rules exist: You get access matching those rules.
    - If NO rules exist (empty list passed to adapter): The adapter returns `null` (no filter).
    - **Note**: This adapter assumes you provided the *relevant* rules. If CASL says "cannot read", you shouldn't be running the query. This adapter is for *filtering* the list.
    - If `ability.rulesFor(...)` returns empty array, it means there are no explicit rules.
    - **Security Note**: This adapter generates a WHERE clause.
        - `null` return -> No filter.
        - `SQL` return -> Apply filter.
        - `SQL(false)` -> Deny all rows.

### Limitations (v0.1.0)
- **No Nested Logic**: `$and` / `$or` inside conditions are not supported.
- **No Relations**: Filtering on related tables (e.g., `author.name`) is not supported.
- **No Field-level Permissions**: Only row-level security.
- **No Unknowns**: Any unknown column name in a rule will throw `UnknownColumnError`.

## License
ISC
