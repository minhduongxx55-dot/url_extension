# Deploy URL Storage Server

## Tong quan

Mot service duy nhat: Express API + Dashboard React (phuc vu file tinh).

```
https://your-app.up.railway.app/           -> Dashboard (React SPA)
https://your-app.up.railway.app/api/       -> API REST
https://your-app.up.railway.app/api/health -> Health check
```

---

## Cach 1: Railway (khuyen nghi — $5 credit/thang, co PostgreSQL)

### Buoc 1 — Dua code len GitHub

1. Tao tai khoan GitHub tai https://github.com (neu chua co)
2. Tao repo moi: nhan **New repository** -> dat ten `url-storage-server` -> **Create repository**
3. Giai nen file zip nay, mo Terminal/CMD trong thu muc vua giai nen
4. Chay lan luot cac lenh sau:

```
git init
git add .
git commit -m "initial"
git branch -M main
git remote add origin https://github.com/USERNAME/url-storage-server.git
git push -u origin main
```

> Thay `USERNAME` bang ten tai khoan GitHub cua ban.

---

### Buoc 2 — Tao project tren Railway

1. Vao https://railway.app -> **Login with GitHub**
2. Nhan **New Project** -> **Deploy from GitHub repo**
3. Chon repo `url-storage-server` vua tao
4. Railway tu detect `railway.toml` va bat dau build (3-5 phut)

---

### Buoc 3 — Them PostgreSQL

1. Trong project -> nhan **+ New** -> **Database** -> **Add PostgreSQL**
2. Database tu tao va gan bien `DATABASE_URL` vao service

---

### Buoc 4 — Them bien moi truong

Vao service -> tab **Variables** -> nhan **Add Variable**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |

> `DATABASE_URL` va `PORT` Railway tu set, khong can them.

---

### Buoc 5 — Lay URL cong khai

- Vao tab **Settings** -> **Networking** -> nhan **Generate Domain**
- Ban nhan duoc URL dang: `https://url-storage-server-xxxx.up.railway.app`

---

### Buoc 6 — Cap nhat Extension

Mo file `background.js` cua extension, sua dong dau:

```javascript
const STORAGE_SERVER = "https://url-storage-server-xxxx.up.railway.app";
```

Sau do vao `chrome://extensions` -> nhan **Reload** extension.

---

## Cach 2: Render (hoan toan mien phi, nhung ngu sau 15 phut)

1. Vao https://render.com -> **New Web Service** -> chon GitHub repo
2. Cai dat:
   - **Build Command**: `npm install -g pnpm@10 && pnpm install --no-frozen-lockfile && pnpm run build`
   - **Start Command**: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
   - **Instance type**: **Free**
3. Them **New PostgreSQL** (mien phi) -> copy **Internal Database URL**
4. Trong Web Service -> **Environment** -> them:
   - `DATABASE_URL` = (URL vua copy)
   - `NODE_ENV` = `production`

---

## Kiem tra sau deploy

| URL | Ket qua mong doi |
|-----|-----------------|
| `https://your-domain/` | Dashboard hien ra |
| `https://your-domain/api/health` | `{"status":"ok"}` |
| `https://your-domain/api/entries` | `[]` hoac danh sach entries |

---

## Troubleshooting

| Loi | Cach xu ly |
|-----|-----------|
| `DATABASE_URL must be set` | Chua them PostgreSQL add-on |
| `Cannot find module` | Build chua hoan thanh, doi them |
| Dashboard trang | Kiem tra `NODE_ENV=production` |
| Extension loi CORS | Kiem tra lai URL trong `background.js` |
| Build fail tren Railway | Xem log Build, thuong do pnpm version |

---

## Cau truc thu muc

```
url-storage-server/
├── artifacts/
│   ├── api-server/         Express.js API
│   └── dashboard/          React + Vite SPA
├── lib/
│   ├── db/                 Drizzle ORM + PostgreSQL schema
│   ├── api-zod/            Zod validation schemas
│   └── api-client-react/   React Query hooks
├── railway.toml            Railway config
├── nixpacks.toml           Node.js 20 config
├── pnpm-workspace.yaml     pnpm monorepo config
└── DEPLOY.md               File nay
```
