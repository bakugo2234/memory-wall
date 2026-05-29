# 🏛️ Memory Wall — Hướng Dẫn Cài Đặt

## Yêu Cầu

Trước khi chạy dự án, bạn cần tạo tài khoản trên 3 dịch vụ miễn phí:

---

## 1. 🗄️ Supabase Setup

### Bước 1: Tạo project
1. Vào [supabase.com](https://supabase.com) → **New Project**
2. Đặt tên: `memory-wall`
3. Lưu lại **Database Password**

### Bước 2: Chạy SQL migration
1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy toàn bộ nội dung file `supabase/migrations/001_initial_schema.sql`
3. Paste vào SQL Editor → **Run**

### Bước 3: Cấu hình Google OAuth
1. Vào **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Tạo credentials tại [Google Cloud Console](https://console.cloud.google.com):
   - Tạo OAuth 2.0 Client ID (Web application)
   - Authorized redirect URIs: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy **Client ID** và **Client Secret** vào Supabase

### Bước 4: Lấy API Keys
1. Vào **Settings** → **API**
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. 🖼️ Cloudinary Setup

1. Vào [cloudinary.com](https://cloudinary.com) → Đăng ký miễn phí
2. Vào **Dashboard** → lấy:
   - **Cloud Name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

---

## 3. ⚙️ Cấu Hình .env.local

Mở file `.env.local` và điền đầy đủ:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. 🚀 Chạy Local

```bash
cd memory-wall
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## 5. 👑 Tạo Admin

**User đầu tiên đăng nhập sẽ tự động là Admin.**

Vì vậy hãy đăng nhập với tài khoản Google của bạn trước tiên!

---

## 6. 🌐 Deploy lên Vercel

```bash
# Cài Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Sau đó thêm toàn bộ environment variables vào Vercel Dashboard.

> **Lưu ý**: Cập nhật `NEXT_PUBLIC_APP_URL` thành URL Vercel của bạn.

---

## 7. 📱 Cấu hình Supabase cho Production

Vào Supabase → **Authentication** → **URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/api/auth/callback`

---

## ✅ Luồng Hoạt Động

```
Người dùng đăng nhập Google
    ↓
Upload ảnh/video → status: "pending"
    ↓
Admin vào /admin → Duyệt hoặc Từ chối
    ↓
Nếu duyệt → bài hiện trên Feed
    ↓
Mọi người React & Comment real-time
```

---

## 📂 Cấu Trúc Project

```
memory-wall/
├── src/
│   ├── app/
│   │   ├── (main)/          # Các trang chính (cần đăng nhập)
│   │   │   ├── page.tsx         # Feed
│   │   │   ├── albums/          # Albums
│   │   │   ├── timeline/        # Memory Wall Timeline
│   │   │   ├── post/[id]/       # Chi tiết bài + comments
│   │   │   └── notifications/   # Thông báo
│   │   ├── admin/           # Admin dashboard
│   │   ├── login/           # Trang đăng nhập
│   │   └── api/
│   │       ├── upload/          # Cloudinary upload
│   │       └── auth/callback/   # Google OAuth
│   ├── components/
│   │   ├── feed/            # PostCard, PostGrid
│   │   ├── upload/          # UploadModal
│   │   ├── albums/          # CreateAlbumModal
│   │   └── layout/          # Navbar
│   ├── lib/supabase/        # Supabase clients
│   ├── store/               # Zustand state
│   ├── types/               # TypeScript types
│   └── utils/               # dateFormat, helpers
└── supabase/migrations/     # SQL schema
```
