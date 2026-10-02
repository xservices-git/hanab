# VAY365 — Triển khai đơn giản

## 1. Build (Windows)

```bash
npm run build:web:deploy
```

## 2. Ship lên VPS

Copy folder `apps/web/.next/standalone` lên VPS, kèm:
- `db/schema.sql`
- `import-db.bat`
- `start.bat`

## 3. Trên VPS

**Lần đầu** (tạo database):
```bat
import-db.bat
```
> Sẽ hỏi MySQL root password. Script tự tạo DB `vay365` + tất cả table.

**Chạy app**:
```bat
start.bat
```
Mở `http://localhost:3000`.

## 4. Update code mới

1. Sửa code
2. `npm run build:web:deploy`
3. Copy folder lên VPS (đè `apps/web/.next/standalone/`)
4. Nếu schema thay đổi: `import-db.bat` lại (idempotent, dùng `IF NOT EXISTS`)

## Lưu ý

- KHÔNG cần `npm install` trên VPS — standalone đã có sẵn `node_modules` đầy đủ 50+ package runtime.
- KHÔNG cần `prisma` trên VPS — dùng file `schema.sql` import trực tiếp qua `mysql` client.
- Yêu cầu: Node.js 18+, MySQL client (`mysql.exe` trong PATH), MySQL server đang chạy.
