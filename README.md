# LUMINA OPTICS — Nền tảng Thương mại Điện tử Mắt kính & Thử kính Ảo AI

Hệ thống thương mại điện tử chuyên ngành mắt kính được xây dựng trên nền tảng React 19, TypeScript, Vite, Tailwind CSS kết hợp dịch vụ Backend Python/Django và Express. Nền tảng tích hợp tính năng Thử kính Ảo (AI Virtual Try-On) trực tiếp trên trình duyệt, bộ lọc gọng kính 6 chiều theo tỷ lệ khuôn mặt, công thức tính cước vận chuyển đường bộ đô thị linh hoạt, động cơ chống trục lợi mã giảm giá và quy trình thanh toán VietQR đối soát hai bước.

---

## Tổng quan hệ thống

Hệ thống giải quyết triệt để các bài toán đặc thù của thương mại điện tử ngành khúc xạ và thời trang mắt kính:

- **Bộ lọc gọng kính 6 chiều:** Đồng bộ hai chiều theo thời gian thực với URL Query String trên 6 tiêu chí: Dáng mặt (Tròn, Vuông, Trái xoan, Dài), Kiểu dáng gọng (7 kiểu), Chất liệu (Titanium, Acetate, Kim loại mạ PVD, TR90), Đối tượng sử dụng, Tông màu sắc và Khoảng giá. Tích hợp cơ chế Debounce 300ms cho ô tìm kiếm.
- **Trải nghiệm Giỏ hàng Mobile-First:** Thao tác thêm vào giỏ không mở ngăn kéo che màn hình duyệt danh mục; phản hồi thị giác tức thì qua hiệu ứng hoạt ảnh CSS và tự động hoàn nguyên nhãn nút sau 1400ms.
- **Thử kính Ảo AI & Kiểm soát Hạn mức:** Nhận diện 468 điểm mốc khuôn mặt và đề xuất dáng kính tương thích qua Gemini Multimodal Vision. Tính năng được bảo vệ bởi lớp xác thực người dùng kèm hạn mức cứng 20 lượt phân tích/ngày/tài khoản (HTTP 429).
- **Thuật toán Cước Vận chuyển Đô thị:** Xác định khoảng cách từ cửa hàng Flagship (294 Phạm Văn Bạch, P. Tân Sơn, Q. Tân Bình, TP.HCM) theo công thức Haversine nhân hệ số khúc khuỷu đường bộ Việt Nam (1.35), phân tầng giá cước chính xác từ phía máy chủ.
- **Động cơ Khuyến mãi Chống Trục lợi:** Đối soát danh tính đa tầng (User ID, Email, Số điện thoại) để ngăn chặn việc tái sử dụng mã chào mừng trọn đời, tự động mở khóa mã ưu đãi theo năm dương lịch mới và áp dụng chiết khấu bậc thang theo số lượng/giá trị đơn.
- **Thanh toán VietQR & Phân xưởng Kỹ thuật:** Tự động sinh mã QR Napas 24/7 theo cú pháp chuẩn `KINH [Mã đơn]`, quy trình Admin phê duyệt biến động số dư trước khi chuyển trạng thái sang phân xưởng mài lắp kính (Kanban).
- **Phân quyền RBAC & Cô lập Giao diện:** Tách biệt tuyệt đối quyền hạn giữa Khách hàng, Kỹ thuật viên (Staff) và Quản trị viên (Admin). Khi đăng nhập Admin, hệ thống ẩn toàn bộ các tiện ích bán hàng của khách để tối ưu không gian quản trị.

---

## Kiến trúc Công nghệ

### Tầng Giao diện (Client)
- **Framework & Ngôn ngữ:** React 19, TypeScript (Chế độ nghiêm ngặt - Strict Mode)
- **Công cụ đóng gói:** Vite 8
- **Thiết kế giao diện:** Tailwind CSS 4
- **Quản lý trạng thái:** Redux Toolkit (Slices: auth, cart, filter, notification)
- **Điều hướng:** React Router v6
- **Đa ngôn ngữ:** react-i18next (Hỗ trợ toàn diện Tiếng Việt và Tiếng Anh)

### Tầng Dịch vụ & Dữ liệu (Backend & Services)
- **Môi trường API:** Python 3.11 / Django Rest Framework (DRF) & Express middleware
- **Cơ sở dữ liệu:** TiDB (Hệ cơ sở dữ liệu phân tán tương thích chuẩn MySQL 8.0)
- **Lưu trữ tệp đa phương tiện:** Cloudinary (Lưu trữ ảnh sản phẩm, ảnh phiếu đo thị lực qua Presigned URL)
- **Xác thực & Thông báo:** Firebase Authentication (Google/Gmail OAuth), Firebase Cloud Messaging (FCM), Gmail SMTP

### Kiểm thử & Đảm bảo Chất lượng (QA)
- **Frontend Testing:** Vitest, React Testing Library, jsdom
- **Backend Testing:** Pytest, pytest-django

---

## Cấu trúc Thư mục

```text
.
├── PROJECT_RULES.md            # Chỉ thị kỹ thuật và quy chuẩn kiến trúc bắt buộc
├── SRS_EYEWEAR_ECOMMERCE.md    # Tài liệu đặc tả yêu cầu nghiệp vụ và kỹ thuật (v1.0.0)
├── .cursorrules                # Chỉ thị hệ thống nạp tự động cho AI Assistant
├── docker-compose.yml          # Điều phối môi trường phát triển đồng nhất
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── backend/
│   ├── apps/core/services.py   # Xử lý nghiệp vụ cước vận chuyển, voucher, quota, đánh giá
│   ├── schema_tidb.sql         # Lược đồ cơ sở dữ liệu quan hệ kèm composite index
│   └── tests/                  # Bộ kiểm thử đơn vị tầng Backend (Pytest)
└── src/
    ├── components/             # Thư viện component UI phân lớp theo tính năng
    ├── hooks/                  # Custom React hooks (useDebounce, useUrlFilterSync)
    ├── i18n/                   # Từ điển bản địa hóa song ngữ (vi.json, en.json)
    ├── pages/                  # Các trang màn hình chính (Storefront, Admin, Staff Kanban)
    ├── services/               # Module gọi API RESTful và kết nối Firebase
    ├── store/slices/           # Redux Slices quản lý state toàn cục
    ├── types/                  # Khai báo kiểu dữ liệu TypeScript dùng chung
    ├── utils/                  # Hàm xử lý logic thuần (Haversine, kiểm tra voucher)
    └── __tests__/              # Bộ kiểm thử đơn vị tầng Frontend (Vitest)
```

---

## Hướng dẫn Cài đặt & Khởi chạy

### Yêu cầu hệ thống
- Node.js >= 20.20.0
- Python >= 3.11
- Trình quản lý gói npm hoặc bun

### Các bước cài đặt

```bash
# Sao chép mã nguồn về máy cục bộ
git clone git@github.com:ThienDoanPlus/ThucHanh.git
cd "Rayban Eyewear"

# Cài đặt các gói phụ thuộc Frontend
npm install --legacy-peer-deps

# Cài đặt các gói phụ thuộc Backend
pip install -r backend/requirements.txt
```

### Cấu hình Biến Môi trường

Tạo tệp cấu hình môi trường cục bộ từ mẫu có sẵn:

```bash
cp .env.example .env.local
```

Các biến môi trường trọng yếu:
- `GEMINI_API_KEY`: Khóa API Google Gemini phục vụ phân tích khuôn mặt thử kính
- `VITE_FIREBASE_CONFIG`: Chuỗi cấu hình kết nối Firebase Authentication & Firestore
- `CLOUDINARY_URL`: Thông tin cấu hình lưu trữ ảnh Cloudinary

### Khởi chạy môi trường phát triển

```bash
# Khởi động máy chủ phát triển tích hợp (Vite + Express API)
npm run dev
```

Ứng dụng sẽ hoạt động tại địa chỉ mặc định: `http://localhost:3000`.

---

## Quy trình Kiểm thử & Nghiệm thu

Toàn bộ các tầng logic nghiệp vụ đều có bộ kiểm thử tự động đi kèm:

```bash
# Chạy kiểm thử đơn vị Frontend (Vitest)
npm test

# Kiểm tra an toàn kiểu dữ liệu TypeScript
npm run lint

# Chạy kiểm thử đơn vị Backend (Pytest)
PYTHONPATH=backend python3 -m pytest backend/tests

# Đóng gói sản phẩm cho môi trường Production
npm run build
```

---

## Tài liệu Kỹ thuật Chi tiết

- [PROJECT_RULES.md](PROJECT_RULES.md): 10 nguyên tắc bất biến, quy chuẩn lập trình và checklist nghiệm thu.
- [SRS_EYEWEAR_ECOMMERCE.md](SRS_EYEWEAR_ECOMMERCE.md): Bảng đặc tả chi tiết 10 phân hệ nghiệp vụ, thiết kế ERD cơ sở dữ liệu và danh mục REST API.
