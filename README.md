# test-christmas-tree4

Cây thông Noel bốc thăm quà (Next.js + Neon + Telegram).

| Route | Dùng cho |
|-------|----------|
| `/` (thêm `?device=ten-may`) | Màn hình bốc thăm trên iPad |
| `/dashboard` | Nhân viên theo dõi lượt trúng quà (cần mật khẩu) |

## Chạy local

```bash
cp .env.example .env.local
npm install
npm run dev
```

- Không có `DATABASE_URL` thì dữ liệu lưu vào `.data/claims.json`.
- `npm run dev` không bao giờ gửi Telegram.

## Deploy Vercel

Environment Variables: `DATABASE_URL` (Neon pooled), `DASHBOARD_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

Tạo bảng lần đầu: `npm run db:push` (với `.env.local` trỏ tới Neon).

## Chạy khi mất mạng

- Lần đầu mở trang: tải hết 8 video (~245MB) vào máy, có thanh tiến trình. Tải xong mới hiện cây thông.
- Sau đó mất mạng vẫn mở trang và bấm quà được; lượt trúng chờ trong máy, có mạng lại sẽ tự gửi.
- **Đổi video nhưng giữ nguyên tên file** thì phải tăng `VIDEO_CACHE` (ví dụ `-v2` → `-v3`) ở cả `lib/offline.ts` và `public/sw.js`, nếu không iPad vẫn phát video cũ.
