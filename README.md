# Frontend Structure (Scaffold)

Thư mục `frontend` được tạo theo cấu trúc kiến trúc của `fe-cme`, nhưng không sao chép source.

## Mục tiêu

- Tách rõ theo domain (`features`)
- Dùng layout + guard + service + store độc lập
- Dễ mở rộng theo module nghiệp vụ

## Cấu trúc chính

- `public/`
- `src/assets/`
- `src/components/`
  - `auth/guards/`
  - `container/`
  - `forms/form-controls/`
  - `modal/`
  - `shared/`
- `src/features/`
  - `auth/pages/`
  - `catalogs/components/`
  - `catalogs/pages/`
  - `system-administration/pages/UserManagement/`
  - `system-administration/pages/RolePermissionManagement/`
- `src/hooks/`
- `src/layouts/`
  - `blank/`
  - `full/shared/`
  - `full/vertical/header/`
  - `full/vertical/sidebar/`
- `src/routes/`
- `src/services/api/`
- `src/store/`
  - `auth/`
  - `catalogs/`
  - `systemAdministration/`
  - `user/`
- `src/theme/`
- `src/utils/http/`

## Trạng thái hiện tại

- Đã có skeleton React + Vite
- Đã có routing, layout, auth guard, API service, Redux store cơ bản
- Đã có trang mẫu:
  - Login
  - Dashboard
  - Catalog
  - User Management

## Chạy nhanh

```bash
npm install
cp .env.example .env
npm run dev
```
