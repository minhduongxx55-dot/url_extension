# Deploy URL Storage Server

## Tổng quan

Project này chạy dưới dạng **1 service duy nhất**:

```text
https://your-app.up.railway.app/             -> Dashboard React
https://your-app.up.railway.app/api/healthz  -> Health check
https://your-app.up.railway.app/api/entries  -> API dữ liệu URL
```

Server đã được sửa để khi khởi động sẽ tự tạo bảng `entries` nếu chưa có. Vì vậy sau khi thêm PostgreSQL trên Railway, bạn không bắt buộc phải chạy `pnpm db:push` nữa.

---

## Deploy trên Railway

### 1. Đẩy source lên GitHub

```bash
git init
git add .
git commit -m "initial deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/url-storage-server.git
git push -u origin main
```

Thay `USERNAME` bằng tài khoản GitHub của bạn.

### 2. Tạo Railway project

```text
Railway -> New Project -> Deploy from GitHub repo -> chọn repo url-storage-server
```

Railway sẽ dùng `railway.toml`:

```bash
npm install -g pnpm@10 && pnpm install --no-frozen-lockfile && pnpm run build
```

Start command:

```bash
node --enable-source-maps artifacts/api-server/dist/index.mjs
```

Health check:

```text
/api/healthz
```

### 3. Thêm PostgreSQL

```text
Project -> + New -> Database -> Add PostgreSQL
```

Sau đó vào service web -> Variables, kiểm tra có:

```env
DATABASE_URL=...
NODE_ENV=production
```

`PORT` Railway tự cấp, không cần tự thêm.

### 4. Tạo public domain

```text
Service -> Settings -> Networking -> Generate Domain
```

Test:

```text
https://your-app.up.railway.app/api/healthz
```

Kết quả đúng:

```json
{"status":"ok"}
```

Dashboard:

```text
https://your-app.up.railway.app/
```

---

## Sửa extension

Trong file `background.js` của extension, đổi `STORAGE_SERVER` thành domain Railway:

```js
const STORAGE_SERVER = "https://your-app.up.railway.app";
```

Sau đó vào:

```text
chrome://extensions -> Reload extension
```

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| Deploy unhealthy | `healthcheckPath` sai | Phải là `/api/healthz` |
| `DATABASE_URL must be set` | Chưa thêm PostgreSQL hoặc biến chưa gắn vào web service | Add PostgreSQL và kiểm tra Variables |
| `relation "entries" does not exist` | Database chưa có bảng | Bản này đã auto-create bảng khi start |
| `Cannot GET /` | API chưa serve dashboard React | Bản này đã serve `artifacts/dashboard/dist/public` |
| Dashboard trắng / API 404 | Build dashboard không ra đúng thư mục | Kiểm tra Vite `outDir` và build log |
