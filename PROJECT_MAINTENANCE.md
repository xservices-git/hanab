# Vay365 Project Maintenance

## Run policy

- Use dev mode for speed.
- Web always runs on port `3000`.
- Preferred command:

```bash
npm run dev:web
```

Expected URL:

```text
http://localhost:3000
```

## Assistant automation rules

When touching UI/code, assistant should do without reminder:

1. Run or reuse dev server.
2. Verify changed page in browser when possible.
3. Run TypeScript check.
4. Search for Vietnamese mojibake before finishing.
5. Update this file if project workflow changes.

## Encoding standard

- Source files must be saved as UTF-8.
- Vietnamese UI text must be real Unicode, not mojibake.
- Bad examples:

```text
Quáº£n trá»‹
NgÆ°á»i dÃ¹ng
ÄÄƒng nháº­p
Máº­t kháº©u
```

- Good examples:

```text
Quản trị
Người dùng
Đăng nhập
Mật khẩu
```

## Validation commands

```bash
npm run typecheck --workspace apps/web
```

Mojibake scan:

```bash
Get-ChildItem apps\web\src -Recurse -Include *.tsx,*.ts | Select-String -Pattern 'Ã|Æ|Ä|áº|â€¢|Â|�'
```

Note: PowerShell console may display UTF-8 Vietnamese incorrectly. Prefer reading files through UTF-8-aware tools or browser verification.

## Fixed encoding files

- `apps/web/src/pages/login.tsx`
- `apps/web/src/pages/register.tsx`
- `apps/web/src/pages/dashboard.tsx`
- `apps/web/src/pages/admin.tsx`
- `apps/web/src/components/Layout.tsx`
- `apps/web/src/pages/api/auth/login.ts`
- `apps/web/src/pages/api/auth/register.ts`

## Removed features

- Sidebar menu item `Bán hàng` removed by user request.
- Sidebar menu item `Leads` removed by user request.
- Do not re-add these menu items unless user explicitly asks.
