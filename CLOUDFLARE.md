# Deploy frontend lên Cloudflare Pages

## 1) Thiết lập project trên Cloudflare

- Framework preset: `Vite`
- Build command: `npm run cf:build`
- Build output directory: `dist`
- Root directory: `fe_sm` (nếu repo root đang chứa thư mục này)
- Không cấu hình `wrangler deploy` trong Build command của Pages

## 2) Cấu hình biến môi trường trên Cloudflare Pages

- Nếu gọi trực tiếp backend:
  - `VITE_API_BASE_URL=https://api.your-domain.com`
- Nếu đi qua Cloudflare Worker gateway:
  - `VITE_API_BASE_URL=https://sm.<subdomain>.workers.dev`

## 3) Cấu hình routing SPA

- Với Pages: để Cloudflare dùng build output `dist` và fallback SPA mặc định của framework preset.
- Với `wrangler deploy` (Workers Assets mode): fallback SPA được cấu hình trong `wrangler.toml`:
  - `[assets]`
  - `not_found_handling = "single-page-application"`

Cấu hình này đảm bảo truy cập trực tiếp các route như `/discipline/journey-90` vẫn render đúng.

## 4) Deploy bằng CLI (tuỳ chọn)

- Build: `npm run cf:build`
- Deploy: `npm run cf:deploy`

Khi chạy deploy CLI lần đầu, dùng đúng project Pages đã tạo trên Cloudflare.

Nếu thấy lỗi:

```txt
main = "src/index.ts"
If are uploading a directory of assets...
```

thì đang chạy nhầm `wrangler deploy` (Workers mode). Với frontend này cần dùng:

- `wrangler pages deploy dist`

## 5) Backend NestJS + Worker

- Backend NestJS hiện tại chạy theo mô hình Node server.
- Có thể dùng `cloudflare-worker` để làm lớp gateway và test kết nối Neon tại `/db/ping`.
- Sau khi deploy frontend, cấu hình CORS backend qua biến `FE_ORIGIN` để chứa domain Cloudflare Pages hoặc domain Worker.

## 6) Checklist khi mở `workers.dev` không thấy giao diện FE

- `workers.dev` là domain của Worker, không phải domain chính để render frontend SPA.
- Frontend phải truy cập bằng domain `pages.dev` (hoặc custom domain gắn với Pages).
- Worker chỉ nên dùng cho API gateway (`/api/*`) và healthcheck.
- Kiểm tra nhanh:
  - `https://<worker>.workers.dev/health` phải trả JSON.
  - `https://<pages>.pages.dev` phải hiển thị giao diện React.
- Nếu `workers.dev` trả HTML chứa `src/main.jsx` thì build/deploy Pages đang chạy sai chế độ (đang serve source thay vì `dist`), cần kiểm tra lại:
  - Root directory = `fe_sm` (hoặc `/` nếu đã chọn đúng thư mục app làm root)
  - Build command = `npm run cf:build`
  - Output directory = `dist`
