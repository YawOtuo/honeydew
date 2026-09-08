# Honeydew Category Management Plan

## Purpose

Honeydew will support a school-specific list of income and expense categories. Administrators will manage categories from the mobile app, and all users will select from those categories when recording a transaction.

This replaces the original V1 decision that categories are maintained only by the developer.

## Agreed Decisions

- Categories are separated into `INCOME` and `EXPENSE` types.
- Category names do not include notes such as `(Description)` or `(Source)`.
- A transaction description is optional for every category. Selecting `Others`, `Loan`, `Maintenance`, or any other category does not make the description mandatory.
- The add-transaction sheet will provide category search.
- Only administrators can create and manage categories.
- Accountants can view and select active categories but cannot modify them.
- Existing categories referenced by transactions must retain their historical meaning.

## Initial Category Catalogue

### Income

1. Fees
2. Feeding
3. Blue Uniform
4. Anniversary Cloth
5. Friday Wear
6. Exercise Books
7. Text Books
8. Stationery
9. Bus Fare
10. Loan
11. Others

### Expense

1. Salary
2. Friday Allowance
3. Market
4. Blue Uniform
5. Anniversary Cloth
6. Friday Wear
7. Exercise Books
8. Text Books
9. Stationery
10. Bus Fuel
11. Uber
12. Waste
13. Bus Maintenance
14. Loan Repayment
15. Insurance
16. Utility Bill
17. Certificates/Permit
18. Maintenance
19. Others

Capitalization and spelling should be normalized consistently in the UI and database. The catalogue above preserves the names agreed during product discussion.

## Add-Transaction Experience

The existing Income/Expense switch continues to determine which categories are available.

When the user opens the Category field:

1. Show only active categories matching the selected transaction type.
2. Present a search input at the top of the category sheet.
3. Filter results case-insensitively as the user types.
4. Preserve a predictable display order, preferably administrator-defined order followed by name.
5. Show a clear empty state when no category matches the search.
6. Clear the selected category when the transaction type changes.

The Description field remains optional and uses the same neutral label and helper text, such as `Add more details (optional)`, for every category. Its label, placeholder, and behavior do not change based on the selected category. For example, a user may enter a loan source in Description when useful, but the UI does not prompt for it specifically. Parenthesized notes from the original category list are guidance for the person entering data, not validation rules.

The category picker must be scrollable and tall enough to handle the full expense list without obscuring the search input.

## Admin Experience

Add an admin-only `Manage categories` row to Settings, alongside Manage Users and Audit History. It opens a category-management screen with:

- Income and Expense sections or tabs.
- A searchable list of categories.
- An `Add category` action.
- Category name and type fields on creation.
- Rename and archive actions for existing categories.
- Clear active/archived status.
- Loading, empty, error, validation, and retry states.

Creation rules:

- Trim surrounding whitespace.
- Reject blank names.
- Enforce the existing case-insensitive equivalent of uniqueness within a type.
- Permit the same name once for Income and once for Expense.
- Make a newly created category immediately available in the add-transaction sheet.

## Category Lifecycle

Categories should be archived rather than hard-deleted. A hard delete can fail when transactions reference the category and could damage the clarity of historical reports.

- Active categories appear in new transaction forms.
- Archived categories remain attached to existing transactions and continue to appear in historical reports.
- When editing an old transaction, its archived category may remain selected, but the user should choose an active category if changing it.
- An administrator can restore an archived category.
- Renaming a category changes how it appears historically. The UI should warn the administrator before confirming a rename.

## Data Model Changes

Extend `Category` with:

```text
isActive   Boolean  default true
sortOrder  Int      default 0
updatedAt  DateTime updated automatically
```

Keep the current relationship between `Transaction` and `Category`, including restricted deletion.

For reliable uniqueness, category names should be normalized before storage or accompanied by a normalized-name field. The database must prevent duplicate names within the same transaction type, including duplicates that differ only by capitalization or surrounding spaces.

## API Changes

Keep the authenticated read endpoint:

```text
GET /api/categories
```

By default, it should return active categories. Admin management may request archived records with a query parameter such as `?includeArchived=true`.

Add admin-only endpoints:

```text
POST  /api/categories
PATCH /api/categories/:id
POST  /api/categories/:id/archive
POST  /api/categories/:id/restore
```

Category creation, rename, archive, and restore operations must create audit-log entries containing the actor, category type, and before/after values where applicable.

## Initial Data and Deployment

Admin management removes the need for developer involvement whenever categories change after launch. The agreed initial catalogue still needs to reach existing and newly created databases once.

Use an idempotent baseline-data operation during rollout to insert any missing catalogue entries without deleting or overwriting existing categories. After that rollout, administrators can maintain the list in Settings. The normal admin category workflow must not depend on rerunning Prisma seed.

## Mobile Data Updates

After an administrator creates, renames, archives, or restores a category:

- Invalidate the categories query cache.
- Invalidate category-based reports when a rename affects their labels.
- Refresh the management list.
- Show a success or failure toast.

The add-transaction sheet should always consume categories from the API rather than hard-coding the catalogue in the app.

## Validation and Permissions

- All category write routes require a valid JWT and the `ADMIN` role.
- The backend, not the mobile UI, is the authority for permissions.
- Transaction creation and updates continue to verify that the category type matches the transaction type.
- New transactions cannot use archived categories.
- Description remains optional and retains the existing maximum length.

## Testing and Acceptance Criteria

- Admin can open Manage Categories from Settings.
- Accountant cannot see the management entry or call category write endpoints.
- Admin can create an Income or Expense category.
- Duplicate names within the same type are rejected regardless of capitalization or extra spaces.
- The same name can exist under both Income and Expense.
- New active categories appear in the add-transaction picker without restarting the app.
- Category search is case-insensitive and handles an empty query.
- Switching transaction type clears an incompatible category selection.
- Description is optional for every category.
- Admin can archive and restore a category.
- Archived categories cannot be selected for new transactions.
- Historical transactions and reports retain archived categories.
- Category management events appear in the audit history.
- The initial catalogue can be applied repeatedly without creating duplicates.

## Implementation Sequence

1. Add the category lifecycle fields and database migration.
2. Add backend DTOs, validation, admin routes, service operations, and audit events.
3. Add the idempotent initial catalogue rollout.
4. Add category API methods and query-cache handling to the mobile app.
5. Build the admin category-management screen and link it from Settings.
6. Add search and scrolling to the transaction category picker.
7. Add backend and mobile tests, then run type-check, build, and Expo validation.

## Out of Scope for This Change

- Category deletion that removes historical records.
- Accountant category management.
- Category hierarchies or subcategories.
- Per-category mandatory transaction descriptions.
- Category-specific Description labels, placeholders, or UI behavior.
- Multiple-school category catalogues.
