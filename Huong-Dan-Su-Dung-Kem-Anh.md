# Tài liệu Hướng dẫn Sử dụng: Hệ thống Quản trị Hành vi Bán hàng

Chào mừng bạn đến với **Hệ thống Quản trị Hành vi Bán hàng**. Tài liệu này cung cấp hướng dẫn sử dụng chi tiết có kèm hình ảnh minh họa cho 3 nhóm người dùng: **Quản trị viên (Admin)**, **Quản lý (Manager)** và **Nhân viên (Employee)**.

---

## 1. Thông tin Tài khoản Đăng nhập

Dưới đây là các tài khoản được cấu hình sẵn để bạn trải nghiệm hệ thống theo từng vai trò:

| Vai trò | Tên đăng nhập | Mật khẩu | Mô tả quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | Quản lý toàn bộ hệ thống, cấu hình người dùng, phân quyền và danh mục (catalog). |
| **Quản lý** | `chinhnk.bdh` | `Vnpt@123` | Xem báo cáo, tra cứu nhật ký của nhân viên cấp dưới và thực hiện chấm điểm hành vi. |
| **Nhân viên** | `thidt.bdh` | `Vnpt@123` | Đăng nhập hàng ngày để khai báo "Lộ trình 90 ngày", bao gồm nhật ký nhận diện và giữ chuẩn. |

---

## 2. Đăng nhập Hệ thống

![Giao diện Đăng nhập](https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20modern%20enterprise%20login%20screen%20with%20username%20and%20password%20inputs%2C%20blue%20theme%2C%20professional%20UI&image_size=landscape_16_9)

**Các bước thực hiện:**
1. Truy cập vào đường dẫn của hệ thống (Ví dụ: `http://localhost:8080` hoặc domain thật).
2. Tại màn hình Đăng nhập, nhập **Tên đăng nhập** và **Mật khẩu** tương ứng với vai trò của bạn.
3. Bấm nút **Đăng nhập**. Hệ thống sẽ tự động chuyển hướng đến Dashboard dựa trên quyền hạn của bạn.

---

## 3. Hướng dẫn dành cho Nhân viên (Khai báo Lộ trình 90 ngày)

Tài khoản sử dụng: `thidt.bdh` / `Vnpt@123`

![Lộ trình 90 ngày](https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20timeline%20interface%20showing%20a%2090%20day%20journey%20with%20progress%20bars%20and%20daily%20status%20cards%2C%20clean%20web%20application%20design&image_size=landscape_16_9)

**Tính năng "Lộ trình 90 ngày"** là nơi nhân viên rèn luyện kỷ luật bán hàng mỗi ngày thông qua việc khai báo nhật ký.

**Cách thực hiện:**
1. Trên thanh menu, chọn **Lộ trình 90 ngày**.
2. Màn hình sẽ hiển thị chuỗi ngày liên tiếp (streak) và tiến độ của bạn (ví dụ: Ngày 15/90).
3. Bấm nút **Mở nhật ký hôm nay**.
4. Khai báo 2 phần (E-form):
   - **Nhật ký nhận diện hàng ngày:** Trả lời trung thực các câu hỏi (Hôm nay né điều gì? Dừng tư vấn sớm ở đâu? Tại sao không bán được?...) $\rightarrow$ Bấm **Lưu E-form Nhận diện**.
   - **Nhật ký giữ chuẩn thu nhập cao:** Ghi lại các chuẩn đã giữ, dấu hiệu tụt chuẩn và giải pháp xử lý $\rightarrow$ Bấm **Lưu E-form Giữ chuẩn**.
5. Sau khi nộp thành công, bạn có thể nhấn nút **Nhắn Telegram** để chia sẻ link cho Quản lý vào chấm điểm.

---

## 4. Hướng dẫn dành cho Quản lý (Tra cứu và Chấm điểm Hành vi)

Tài khoản sử dụng: `chinhnk.bdh` / `Vnpt@123`

![Giao diện Chấm điểm](https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=An%20evaluation%20interface%20comparing%20employee%20self-review%20with%20manager%20ratings%2C%20split%20columns%2C%20modern%20web%20UI&image_size=landscape_16_9)

Quản lý có nhiệm vụ theo dõi và phản hồi lại các nhật ký rèn luyện của nhân viên.

**Cách thực hiện:**
1. Trên thanh menu, chọn **Tra cứu nhật ký**.
2. Sử dụng bộ lọc (Từ ngày - Đến ngày, hoặc Tên nhân viên) để tìm kiếm hồ sơ cần duyệt.
3. Bấm vào một **Thẻ hồ sơ (Card)** đang có trạng thái *"Chờ sếp chấm"*. Hệ thống sẽ chuyển sang màn hình **Đánh giá chi tiết**.
4. Tại màn hình chi tiết:
   - Cột bên trái: Đọc phần tự khai báo của nhân viên (Nhận diện & Giữ chuẩn).
   - Cột bên phải: Quản lý thực hiện đánh giá (Đạt/Chưa đạt) cho các tiêu chí (Hỏi sâu, Tư vấn đủ, Theo đến cùng) và nhập **Ghi chú/Phản hồi**.
5. Bấm **Lưu E-form Nhận diện** và **Lưu E-form Giữ chuẩn** để hoàn tất việc chấm điểm.
6. Bạn cũng có thể bấm **Sao chép URL** để gửi trực tiếp link bài đánh giá này cho nhân viên qua tin nhắn.

---

## 5. Hướng dẫn dành cho Admin (Quản trị Hệ thống)

Tài khoản sử dụng: `admin` / `Admin@123`

![Quản lý Người dùng](https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20modern%20data%20table%20showing%20a%20list%20of%20users%20with%20roles%2C%20search%20bar%2C%20and%20action%20buttons%2C%20admin%20panel%20design&image_size=landscape_16_9)

Admin có quyền truy cập vào khu vực **Trung tâm cấu hình** để thiết lập danh mục, tài khoản và phân quyền.

**Các tính năng chính:**
- **Cấu hình người dùng:** 
  - Xem danh sách toàn bộ tài khoản trong hệ thống.
  - Thêm mới, chỉnh sửa thông tin (Tên, Username, Đơn vị) và đặt lại mật khẩu cho nhân viên/quản lý.
  - Cấu hình **Telegram Chat ID** để phục vụ việc gửi thông báo.
- **Cấu hình quyền:**
  - Thiết lập vai trò (Role) và ánh xạ các quyền hạn (Permissions) tương ứng trên hệ thống.
- **Cấu hình Catalog:**
  - Quản lý các danh mục từ điển dùng chung (Đơn vị, Chức danh, Loại dịch vụ, ...).

---

## 6. Chức năng Cá nhân (Đổi Mật Khẩu & Đăng Xuất)

Dù bạn đăng nhập bằng vai trò nào, bạn đều có thể quản lý tài khoản cá nhân ở góc phải trên cùng màn hình.

1. **Đổi mật khẩu:**
   - Bấm vào nút **Đổi mật khẩu** ở góc trên bên phải.
   - Nhập *Mật khẩu hiện tại*, *Mật khẩu mới* và *Xác nhận mật khẩu mới*.
   - Bấm **Lưu** để cập nhật.
2. **Đăng xuất:**
   - Bấm nút **Đăng xuất** màu đỏ để thoát khỏi hệ thống an toàn và trở về màn hình Login.

---
*Tài liệu được tự động tạo kèm hình ảnh minh họa AI. Vui lòng mở bằng chế độ Preview Markdown (bấm chuột phải vào file -> Open Preview) để xem ảnh đầy đủ.*
