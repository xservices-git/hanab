# VAY365 — Quản lý cho vay

Monorepo: Next.js 14 + Socket.IO worker + Prisma/MySQL + Redis + Zustand + shadcn/ui

## Cấu trúc

```
vay365/
├── apps/
│   ├── web/          # Next.js 14 (pages router)
│   └── worker/       # Socket.IO + Redis pub/sub
├── packages/
│   └── shared/       # Prisma schema, types, auth
├── infrastructure/
│   ├── nginx/        # Hardened Nginx config
│   └── docker/       # Dockerfiles + docker-compose
├── package.json      # Workspace root
└── turbo.json        # Turborepo config
```

## Quick start (dev)

```bash
# 1. Clone + install
npm install

# 2. Start MySQL + Redis
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up -d

# 3. Setup env
cp apps/web/.env.example apps/web/.env.local
# Edit DATABASE_URL, JWT_SECRET

# 4. Generate Prisma + migrate + seed
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Dev
npm run dev:web      # http://localhost:3000
npm run dev:worker   # ws://localhost:3001
```

## Deploy production (Docker + Nginx + SSL)

### 1. Chuan bi server

Yeu cau VPS/Linux co Docker + Docker Compose plugin. Domain can tro DNS A record ve IP server truoc khi xin SSL.

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
```

### 2. Clone source len server

```bash
git clone <PRIVATE_REPO_URL> vay365
cd vay365
```

### 3. Tao bien moi truong production

```bash
cd infrastructure/docker
cp .env.example .env
nano .env
```

Bat buoc doi gia tri production:

```env
MYSQL_ROOT_PASSWORD=change_me_strong_root_password
MYSQL_PASSWORD=change_me_strong_mysql_password
REDIS_PASSWORD=change_me_strong_redis_password
JWT_SECRET=change_me_long_random_secret
```

Tao `JWT_SECRET` manh:

```bash
openssl rand -base64 48
```

### 4. Kiem tra domain trong cau hinh

Production hien dung domain:

- `giaingan365days.online`
- `admin.giaingan365days.online`
- `sale.giaingan365days.online`

Neu doi domain, cap nhat trong:

- `infrastructure/docker/docker-compose.yml`
- `infrastructure/nginx/nginx.conf`

### 5. Build va chay service

```bash
docker compose up -d --build mysql redis
docker compose up -d --build web worker nginx
```

### 6. Chay migration database

```bash
docker compose exec web npx prisma migrate deploy
```

Seed du lieu lan dau neu can tai khoan mac dinh:

```bash
docker compose exec web npx prisma db seed
```

### 7. Cap SSL Let's Encrypt lan dau

```bash
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d giaingan365days.online \
  -d admin.giaingan365days.online \
  -d sale.giaingan365days.online

docker compose restart nginx
```

Certbot container se tu renew moi 12 gio theo `docker-compose.yml`.

### 8. Kiem tra production

```bash
docker compose ps
docker compose logs -f web worker nginx
curl -I https://giaingan365days.online
```

Ky vong:

- `web`, `worker`, `nginx`, `mysql`, `redis` deu `Up`
- HTTPS tra `200` hoac `3xx`
- Login admin hoat dong

### 9. Update phien ban moi

```bash
git pull
cd infrastructure/docker
docker compose up -d --build web worker nginx
docker compose exec web npx prisma migrate deploy
docker compose ps
```

### 10. Backup production

Backup MySQL:

```bash
docker compose exec mysql mysqldump -u root -p vay365 > backup-vay365-$(date +%F).sql
```

Backup volumes quan trong:

```bash
docker volume ls | grep vay365
```

Khong commit file `.env`, database dump, SSL private keys len GitHub.

## Tài khoản mặc định (seed)

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | [email protected]  | admin123456|
| Sale  | [email protected]   | sale123456 |

## Pages

| Path              | Role          | Mô tả              |
|-------------------|---------------|---------------------|
| /login            | Public        | Đăng nhập           |
| /register         | Public        | Đăng ký             |
| /dashboard        | All logged in | Tổng quan           |
| /dashboard/loans  | All logged in | Quản lý khoản vay   |
| /sale/leads       | Admin, Agent  | Quản lý leads       |
| /admin/users      | Admin only    | Quản lý người dùng  |

## API Routes

| Method | Path                | Auth   | Mô tả              |
|--------|---------------------|--------|---------------------|
| POST   | /api/auth/login     | Public | Đăng nhập           |
| POST   | /api/auth/register  | Public | Đăng ký             |
| GET    | /api/auth/me        | JWT    | Lấy thông tin user  |
| GET    | /api/dashboard/stats| JWT    | Thống kê dashboard  |
| GET    | /api/loans          | JWT    | Danh sách khoản vay |
| POST   | /api/loans          | JWT    | Tạo khoản vay       |
| GET    | /api/leads          | JWT    | Danh sách leads     |
| POST   | /api/leads          | JWT    | Tạo lead            |
| GET    | /api/admin/users    | Admin  | Danh sách users     |

## Tech stack

- **Frontend:** Next.js 14, React 18, TailwindCSS, shadcn/ui, Zustand
- **Backend:** Node.js, Next.js API routes
- **Realtime:** Socket.IO + Redis pub/sub
- **Database:** MySQL 8 + Prisma ORM
- **Auth:** JWT (jose) + bcryptjs
- **Infra:** Docker, Nginx, Let's Encrypt
- **Workspace:** Turborepo + npm workspaces
