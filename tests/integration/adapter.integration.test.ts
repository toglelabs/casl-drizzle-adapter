import { defineAbility } from "@casl/ability";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { gte } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCaslDrizzleAdapter } from "../../src";

// Define test schema
const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id"),
  isPublic: boolean("is_public"),
  archived: boolean("archived"),
  category: text("category"),
  views: integer("views"),
});

describe("casl-drizzle-adapter integration", () => {
  let container: any;
  let db: ReturnType<typeof drizzle>;
  let sql: postgres.Sql;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer("postgres:latest").start();

    // Create database connection
    const connectionString = container.getConnectionUri();
    sql = postgres(connectionString);
    db = drizzle(sql);

    // Create table
    await sql`
      CREATE TABLE sites (
        id SERIAL PRIMARY KEY,
        owner_id TEXT,
        is_public BOOLEAN,
        archived BOOLEAN,
        category TEXT,
        views INTEGER
      )
    `;

    // Insert test data
    await db.insert(sites).values([
      {
        ownerId: "user1",
        isPublic: true,
        archived: false,
        category: "tech",
        views: 100,
      },
      {
        ownerId: "user1",
        isPublic: false,
        archived: false,
        category: "news",
        views: 50,
      },
      {
        ownerId: "user2",
        isPublic: true,
        archived: false,
        category: "tech",
        views: 200,
      },
      {
        ownerId: "user2",
        isPublic: false,
        archived: true,
        category: "news",
        views: 10,
      },
      {
        ownerId: "user3",
        isPublic: true,
        archived: false,
        category: "sports",
        views: 300,
      },
    ]);
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    // Clean up
    if (sql) await sql.end();
    if (container) await container.stop();
  });

  const adapter = createCaslDrizzleAdapter({ table: sites });

  it("should filter sites visible to user1", async () => {
    // User1 can read their own sites or public sites
    const ability = defineAbility((can) => {
      can("read", "Site", { ownerId: "user1" });
      can("read", "Site", { isPublic: true });
    });

    const filter = adapter.filterFromAbility(ability, "read", "Site");

    const results = await db.select().from(sites).where(filter!);

    // Should return user1's private site, user1's public site, user2's public site, user3's public site
    // But not user2's private archived site
    expect(results).toHaveLength(4);
    const ownerIds = results.map((r) => r.ownerId).sort();
    expect(ownerIds).toEqual(["user1", "user1", "user2", "user3"]);
  });

  it("should filter sites visible to user2", async () => {
    // User2 can only read their own sites (no public access)
    const ability = defineAbility((can) => {
      can("read", "Site", { ownerId: "user2" });
    });

    const filter = adapter.filterFromAbility(ability, "read", "Site");

    const results = await db.select().from(sites).where(filter!);

    // Should return only user2's sites: one public, one private archived
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.ownerId === "user2")).toBe(true);
  });

  it("should deny access when cannot rules override", async () => {
    // Can read public sites but cannot read archived ones
    const ability = defineAbility((can, cannot) => {
      can("read", "Site", { isPublic: true });
      cannot("read", "Site", { archived: true });
    });

    const filter = adapter.filterFromAbility(ability, "read", "Site");

    const results = await db.select().from(sites).where(filter!);

    // Should return public non-archived sites: user1 public, user2 public, user3 public
    // But not user2's archived private site (not public), and not if any public archived (none in data)
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.isPublic && !r.archived)).toBe(true);
  });

  it("should handle complex conditions with custom operators", async () => {
    // Add custom operator for views
    const customAdapter = createCaslDrizzleAdapter({
      table: sites,
      operators: {
        $gte: (col, val) => gte(col as any, val as any),
      },
    });

    const ability = defineAbility((can) => {
      can("read", "Site", { views: { $gte: 100 } });
    });

    const filter = customAdapter.filterFromAbility(ability, "read", "Site");

    const results = await db.select().from(sites).where(filter!);

    // Should return sites with views >= 100: user1 public (100), user2 public (200), user3 public (300)
    expect(results).toHaveLength(3);
    expect(results.every((r) => (r.views ?? 0) >= 100)).toBe(true);
  });
});
