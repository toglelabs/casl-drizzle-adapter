---
"casl-drizzle-query-adapter": patch
---

Fixed permission handling for rules with no conditions and deny-all scenarios

- Admin users with no condition rules now get full access (no WHERE clause)
- Users with no permissions or banned users get empty results
- Improved handling of CASL rules with undefined conditions
- Added comprehensive integration tests for real-world permission scenarios