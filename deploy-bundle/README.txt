# VAY365 - Production Deployment

## Quick start

```cmd
notepad .env         REM sua DATABASE_URL, JWT_SECRET, PORT
start.bat            REM tu check MySQL, tao DB, migrate, seed, start
```

## File co ban

| File | Chuc nang |
|---|---|
| `start.bat`         | All-in-one: check MySQL, tao DB, migrate, seed, start |
| `start-bg.bat`      | Chay nen (dong terminal van chay) |
| `stop.bat`          | Tat server |
| `status.bat`        | Xem trang thai + test HTTP + log |
| `install-service.bat`  | Cai lam Windows Service (auto-restart) |
| `uninstall-service.bat`| Go service |

## Truy cap

- App: http://localhost:3000
- Admin (sau seed): `0900000001` / `999999`

## YEU CAU

- Windows 10+
- Node.js 20+ (https://nodejs.org)
- MySQL 5.7+ hoac MariaDB 10+ (XAMPP OK)
