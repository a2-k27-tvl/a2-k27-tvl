# A2-K27-TVL — Đăng ký / Đăng nhập OTP

## Cấu trúc
```
index.html
css/style.css
js/firebase-init.js   -> khởi tạo Firebase (Auth, Realtime Database, Storage)
js/email-otp.js        -> sinh mã OTP, gửi qua EmailJS, xác minh, đếm ngược 60s
js/auth.js              -> toàn bộ luồng đăng ký / đăng nhập / quên mật khẩu / mã nhanh
js/maintenance.js       -> gác phiên đăng nhập + trang bảo trì + đổi ảnh đại diện/bìa
```

## Việc bạn PHẢI làm trước khi chạy được

### 1. Bật Email/Password trong Firebase Authentication
Firebase Console > Authentication > Sign-in method > bật **Email/Password**.

### 2. Lấy đúng `databaseURL` của Realtime Database
Trong `js/firebase-init.js` mình để tạm một URL đoán theo khu vực Singapore.
Vào Firebase Console > Realtime Database > copy đúng URL hiển thị trên đầu trang, dán đè vào biến `databaseURL`.

### 3. Đặt Rules cho Realtime Database
Vào Realtime Database > Rules, dùng tạm bộ rule sau (siết chặt hơn khi làm phần quản trị Owner/Admin):
```json
{
  "rules": {
    "usernames": {
      ".read": true,
      "$username": { ".write": "!data.exists()" }
    },
    "users": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "otp_pending": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 4. Bật Firebase Storage
Firebase Console > Storage > Get started (chọn chế độ mặc định). Rules cơ bản:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Đăng ký EmailJS (miễn phí) để gửi OTP thật
1. Vào https://www.emailjs.com/ tạo tài khoản.
2. Add một Email Service (Gmail/Outlook...), lấy **Service ID**.
3. Tạo Email Template có 2 biến bắt buộc: `{{to_email}}` và `{{otp_code}}`. Ví dụ nội dung:
   > Mã OTP của bạn là {{otp_code}}, có hiệu lực trong 5 phút.
   Lấy **Template ID**.
4. Vào Account > General, lấy **Public Key**.
5. Mở `js/email-otp.js`, điền 3 giá trị vào:
   ```js
   const EMAILJS_PUBLIC_KEY  = "...";
   const EMAILJS_SERVICE_ID  = "...";
   const EMAILJS_TEMPLATE_ID = "...";
   ```

### 6. Đặt link "Liên hệ Admin"
Trong `js/auth.js`, sửa dòng:
```js
$("link-contact-admin").href = "https://t.me/DIEN_LIEN_HE_ADMIN_CUA_BAN";
```

### 7. Tạo tài khoản Owner đầu tiên
Chưa có giao diện cấp quyền. Sau khi đăng ký một tài khoản bình thường, vào
Firebase Console > Realtime Database > `users/{uid}/role`, sửa giá trị từ
`"user"` thành `"owner"` bằng tay.

## Vì sao "quên mật khẩu" không dùng OTP tự đổi mật khẩu?
Trình duyệt (client SDK của Firebase) không được phép tự đổi mật khẩu của một
tài khoản khác — chỉ tài khoản đang đăng nhập mới tự đổi được mật khẩu của
chính nó. Muốn có luồng "nhập OTP số rồi đặt mật khẩu mới" đúng như mô tả ban
đầu, bắt buộc phải có backend (Cloud Functions + Firebase Admin SDK) để xử lý
việc đổi mật khẩu thay người dùng. Bản này dùng tạm
`sendPasswordResetEmail` (email đặt lại mật khẩu chính chủ của Firebase) để
đảm bảo an toàn trong lúc hệ thống chưa có backend. Khi bạn sẵn sàng làm phần
Cloud Functions, chỉ cần thay đúng đoạn xử lý trong `btn-resend-otp-forgot`
ở `js/auth.js`.

## Cách "Mã đăng nhập nhanh" hoạt động
Owner cấp mã bằng cách vào Realtime Database, sửa
`users/{uid}/quickLoginCode` thành một chuỗi bất kỳ. Người dùng có mã này ở
bước OTP đăng nhập lần 2 có thể nhập mã đó thay vì chờ email, để vào thẳng
trang bảo trì.
