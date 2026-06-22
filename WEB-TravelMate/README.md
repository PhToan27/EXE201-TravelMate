# TravelMate Web

Phiên bản web riêng để deploy cho người dùng. App dùng chung backend API của TravelMate.

## Chạy local

```bash
npm install
npm run dev
```

Mặc định app gọi API từ biến môi trường:

```env
VITE_API_BASE_URL=https://exe201-travelmate-1.onrender.com/api
```

Tạo file `.env` từ `.env.example` nếu cần đổi backend.

## Deploy Render Static Site

- Root Directory: `WEB-TravelMate`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variable:
  - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

## Chức năng hiện có

- Đăng nhập / đăng ký.
- Tạo chuyến đi kèm AI itinerary.
- Preview lịch trình trước khi tạo.
- Xem danh sách và chi tiết chuyến đi.
- Tìm kiếm địa điểm trong database.
