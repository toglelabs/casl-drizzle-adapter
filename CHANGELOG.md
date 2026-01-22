# casl-drizzle-query-adapter

## 0.1.2

### Patch Changes

- 24e7b72: Fixed permission handling for rules with no conditions and deny-all scenarios

  - Admin users with no condition rules now get full access (no WHERE clause)
  - Users with no permissions or banned users get empty results
  - Improved handling of CASL rules with undefined conditions
  - Added comprehensive integration tests for real-world permission scenarios

## 0.1.1

### Patch Changes

- e1e9047: Fix for incorrect package imports
