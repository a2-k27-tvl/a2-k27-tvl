import { database, ref, set, get, update } from './firebase-config.js';
import { findUserByEmail } from './auth.js';

// Lưu OTP vào database
export async function saveOTP(email, otp) {
    try {
        const otpData = {
            otp: otp,
            email: email,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            attempts: 0,
            used: false
        };
        
        const key = email.replace(/[.#$\/\[\]]/g, '_');
        await set(ref(database, `otps/${key}`), otpData);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Lấy OTP từ database
export async function getOTP(email) {
    try {
        const key = email.replace(/[.#$\/\[\]]/g, '_');
        const snapshot = await get(ref(database, `otps/${key}`));
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
            throw new Error('OTP không tồn tại! Vui lòng gửi lại mã.');
        }
        
        const otpData = result.data;
        
        if (otpData.used) {
            throw new Error('OTP đã được sử dụng!');
        }
        
        const now = new Date();
        const expiresAt = new Date(otpData.expiresAt);
        if (now > expiresAt) {
            throw new Error('OTP đã hết hạn! Vui lòng gửi lại mã.');
        }
        
        if (otpData.attempts >= 5) {
            throw new Error('Quá số lần thử cho phép! Vui lòng gửi lại mã.');
        }
        
        if (otpData.otp !== otp) {
            const key = email.replace(/[.#$\/\[\]]/g, '_');
            await update(ref(database, `otps/${key}`), {
                attempts: otpData.attempts + 1
            });
            throw new Error('OTP không đúng!');
        }
        
        const key = email.replace(/[.#$\/\[\]]/g, '_');
        await update(ref(database, `otps/${key}`), {
            used: true
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Xóa OTP
export async function deleteOTP(email) {
    try {
        const key = email.replace(/[.#$\/\[\]]/g, '_');
        await set(ref(database, `otps/${key}`), null);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Tạo OTP ngẫu nhiên (6 số)
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi OTP qua email (hiện tại log ra console để test)
export async function sendOTPEmail(email, otp) {
    try {
        // TRONG THỰC TẾ: Gọi API gửi email ở đây
        // Ví dụ dùng EmailJS, SendGrid, Nodemailer...
        
        console.log(`📧 ========================================`);
        console.log(`📧 GỬI OTP ĐẾN: ${email}`);
        console.log(`📧 MÃ OTP CỦA BẠN LÀ: ${otp}`);
        console.log(`📧 OTP CÓ HIỆU LỰC TRONG 10 PHÚT`);
        console.log(`📧 ========================================`);
        
        // HIỂN THỊ POPUP THÔNG BÁO (để dễ test)
        alert(`📧 Mã OTP đã được gửi đến ${email}\n\nMã OTP: ${otp}\n\n(Kiểm tra console để xem chi tiết)`);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
