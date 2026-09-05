import { database, ref, set, get, child, update } from './firebase-config.js';

// Lưu OTP vào database
export async function saveOTP(email, otp) {
    try {
        const otpData = {
            otp: otp,
            email: email,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 phút
            attempts: 0,
            used: false
        };
        
        await set(ref(database, `otps/${email.replace(/[.#$\/\[\]]/g, '_')}`), otpData);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Lấy OTP từ database
export async function getOTP(email) {
    try {
        const snapshot = await get(ref(database, `otps/${email.replace(/[.#$\/\[\]]/g, '_')}`));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        return { success: false, error: 'OTP không tồn tại!' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Xác thực OTP
export async function verifyOTP(email, otp) {
    try {
        const result = await getOTP(email);
        if (!result.success) {
            throw new Error('OTP không tồn tại!');
        }
        
        const otpData = result.data;
        
        // Kiểm tra OTP đã được sử dụng chưa
        if (otpData.used) {
            throw new Error('OTP đã được sử dụng!');
        }
        
        // Kiểm tra OTP đã hết hạn chưa
        const now = new Date();
        const expiresAt = new Date(otpData.expiresAt);
        if (now > expiresAt) {
            throw new Error('OTP đã hết hạn!');
        }
        
        // Kiểm tra số lần thử
        if (otpData.attempts >= 5) {
            throw new Error('Quá số lần thử cho phép!');
        }
        
        // Kiểm tra OTP
        if (otpData.otp !== otp) {
            // Tăng số lần thử
            await update(ref(database, `otps/${email.replace(/[.#$\/\[\]]/g, '_')}`), {
                attempts: otpData.attempts + 1
            });
            throw new Error('OTP không đúng!');
        }
        
        // Đánh dấu OTP đã sử dụng
        await update(ref(database, `otps/${email.replace(/[.#$\/\[\]]/g, '_')}`), {
            used: true
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Xóa OTP sau khi sử dụng
export async function deleteOTP(email) {
    try {
        await set(ref(database, `otps/${email.replace(/[.#$\/\[\]]/g, '_')}`), null);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Tạo OTP ngẫu nhiên (6 số)
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi OTP qua email (dùng API hoặc EmailJS)
export async function sendOTPEmail(email, otp) {
    try {
        // Sử dụng EmailJS hoặc service gửi email
        // Ví dụ dùng EmailJS (bạn cần đăng ký EmailJS)
        /*
        const templateParams = {
            to_email: email,
            otp_code: otp
        };
        
        const response = await emailjs.send('service_id', 'template_id', templateParams);
        */
        
        // Tạm thời console.log để test
        console.log(`📧 Gửi OTP ${otp} đến email: ${email}`);
        
        // Trong thực tế, bạn sẽ gọi API gửi email ở đây
        // Có thể dùng: EmailJS, SendGrid, Nodemailer (backend)
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
