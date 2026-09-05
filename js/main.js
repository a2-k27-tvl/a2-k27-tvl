import { 
    checkUsername, checkEmail, registerUser, loginUser, getUserData, findUserByEmail 
} from './auth.js';
import { 
    generateOTP, saveOTP, verifyOTP, sendOTPEmail, deleteOTP 
} from './otp.js';
import { database, ref, get, update } from './firebase-config.js';

// ============ DOM ELEMENTS ============
const registerSection = document.getElementById('registerSection');
const loginSection = document.getElementById('loginSection');
const forgotSection = document.getElementById('forgotSection');
const verifySection = document.getElementById('verifySection');

const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const displayNameInput = document.getElementById('displayName');
const otpCodeInput = document.getElementById('otpCode');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const otpTimer = document.getElementById('otpTimer');
const otpStatus = document.getElementById('otpStatus');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');

const switchToLogin = document.getElementById('switchToLogin');
const switchToRegister = document.getElementById('switchToRegister');
const backToLogin = document.getElementById('backToLogin');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

// ============ STATE ============
let otpTimerInterval = null;
let currentEmail = '';

// ============ CHUYỂN TAB ============
function showSection(sectionId) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('loginSection');
});

switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('registerSection');
});

backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('loginSection');
});

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('forgotSection');
});

// ============ KIỂM TRA USERNAME ============
usernameInput.addEventListener('blur', async () => {
    const username = usernameInput.value.trim();
    if (username.length < 3) {
        usernameInput.classList.add('error');
        document.getElementById('usernameStatus').textContent = '❌ Tên đăng nhập tối thiểu 3 ký tự!';
        document.getElementById('usernameStatus').className = 'status-text error';
        return;
    }
    
    const exists = await checkUsername(username);
    if (exists) {
        usernameInput.classList.add('error');
        document.getElementById('usernameStatus').textContent = '❌ Tên đăng nhập đã tồn tại!';
        document.getElementById('usernameStatus').className = 'status-text error';
    } else {
        usernameInput.classList.remove('error');
        usernameInput.classList.add('success');
        document.getElementById('usernameStatus').textContent = '✅ Tên đăng nhập hợp lệ!';
        document.getElementById('usernameStatus').className = 'status-text success';
    }
});

// ============ KIỂM TRA EMAIL ============
emailInput.addEventListener('blur', async () => {
    const email = emailInput.value.trim();
    if (!isValidEmail(email)) {
        emailInput.classList.add('error');
        document.getElementById('emailStatus').textContent = '❌ Email không hợp lệ!';
        document.getElementById('emailStatus').className = 'status-text error';
        return;
    }
    
    const exists = await checkEmail(email);
    if (exists) {
        emailInput.classList.add('error');
        document.getElementById('emailStatus').textContent = '❌ Email đã được sử dụng!';
        document.getElementById('emailStatus').className = 'status-text error';
    } else {
        emailInput.classList.remove('error');
        emailInput.classList.add('success');
        document.getElementById('emailStatus').textContent = '✅ Email hợp lệ!';
        document.getElementById('emailStatus').className = 'status-text success';
        currentEmail = email;
    }
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============ GỬI OTP ============
sendOtpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    if (!isValidEmail(email)) {
        otpStatus.textContent = '❌ Vui lòng nhập email hợp lệ trước!';
        otpStatus.className = 'status-text error';
        emailInput.focus();
        return;
    }
    
    const exists = await checkEmail(email);
    if (exists) {
        otpStatus.textContent = '❌ Email đã được sử dụng!';
        otpStatus.className = 'status-text error';
        return;
    }
    
    const otp = generateOTP();
    const saveResult = await saveOTP(email, otp);
    
    if (!saveResult.success) {
        otpStatus.textContent = '❌ Lỗi lưu OTP!';
        otpStatus.className = 'status-text error';
        return;
    }
    
    // Gửi OTP (hiện alert + console)
    console.log(`📧 MÃ OTP: ${otp} - GỬI ĐẾN: ${email}`);
    alert(`📧 Mã OTP của bạn là: ${otp}\n\nĐã gửi đến: ${email}\n\nVui lòng nhập mã vào ô bên dưới!`);
    
    otpStatus.textContent = '✅ Mã OTP đã được gửi! Vui lòng kiểm tra email.';
    otpStatus.className = 'status-text success';
    startOTPTimer();
    currentEmail = email;
    
    // Tự động focus vào ô OTP
    otpCodeInput.focus();
});

// ============ TIMER OTP ============
function startOTPTimer() {
    let seconds = 60;
    sendOtpBtn.disabled = true;
    otpTimer.textContent = `⏳ Có thể gửi lại sau ${seconds}s`;
    
    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
        seconds--;
        otpTimer.textContent = `⏳ Có thể gửi lại sau ${seconds}s`;
        
        if (seconds <= 0) {
            clearInterval(otpTimerInterval);
            sendOtpBtn.disabled = false;
            otpTimer.textContent = '✅ Có thể gửi lại mã';
        }
    }, 1000);
}

// ============ ĐĂNG KÝ ============
document.getElementById('registerSubmitBtn').addEventListener('click', async () => {
    const displayName = displayNameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const otp = otpCodeInput.value.trim();
    
    // Kiểm tra từng trường
    if (!displayName) {
        alert('❌ Vui lòng nhập tên hiển thị!');
        displayNameInput.focus();
        return;
    }
    
    if (!username) {
        alert('❌ Vui lòng nhập tên đăng nhập!');
        usernameInput.focus();
        return;
    }
    
    if (!email) {
        alert('❌ Vui lòng nhập email!');
        emailInput.focus();
        return;
    }
    
    if (!password) {
        alert('❌ Vui lòng nhập mật khẩu!');
        passwordInput.focus();
        return;
    }
    
    if (password.length < 6) {
        alert('❌ Mật khẩu tối thiểu 6 ký tự!');
        passwordInput.focus();
        return;
    }
    
    if (!otp || otp.length !== 6) {
        alert('❌ Vui lòng nhập mã OTP 6 số!\n\nHướng dẫn:\n1. Nhập email\n2. Bấm "Gửi mã"\n3. Nhập OTP vào ô');
        otpCodeInput.focus();
        return;
    }
    
    // Xác thực OTP
    const verifyResult = await verifyOTP(email, otp);
    
    if (!verifyResult.success) {
        alert(`❌ ${verifyResult.error}`);
        return;
    }
    
    // Đăng ký
    const userData = {
        displayName,
        username,
        email,
        password
    };
    
    const result = await registerUser(userData);
    
    if (result.success) {
        alert('✅ Đăng ký thành công! Vui lòng đăng nhập.');
        showSection('loginSection');
        
        // Reset form
        displayNameInput.value = '';
        usernameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        otpCodeInput.value = '';
        document.getElementById('usernameStatus').textContent = '';
        document.getElementById('emailStatus').textContent = '';
        document.getElementById('otpStatus').textContent = '';
        usernameInput.classList.remove('success', 'error');
        emailInput.classList.remove('success', 'error');
        
        await deleteOTP(email);
    } else {
        alert(`❌ ${result.error}`);
    }
});

// ============ ĐĂNG NHẬP ============
document.getElementById('loginSubmitBtn').addEventListener('click', async () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    if (!username || !password) {
        alert('❌ Vui lòng nhập tên đăng nhập và mật khẩu!');
        return;
    }
    
    const result = await loginUser(username, password);
    
    if (result.success) {
        const maskedEmail = maskEmail(result.userData.email);
        document.getElementById('verifyMessage').textContent = 
            `Chúng tôi đã gửi mã về email ${maskedEmail}, bạn hãy kiểm tra hộp thư để hoàn thành việc đăng nhập`;
        
        showSection('verifySection');
        
        const otp = generateOTP();
        await saveOTP(result.userData.email, otp);
        await sendOTPEmail(result.userData.email, otp);
        
        sessionStorage.setItem('loginOTPEmail', result.userData.email);
        sessionStorage.setItem('pendingLogin', JSON.stringify({
            userId: result.userId,
            userData: result.userData
        }));
    } else {
        if (result.error === 'Mật khẩu không chính xác!') {
            const confirmReset = confirm('❌ Mật khẩu không đúng! Bạn có muốn chuyển đến trang quên mật khẩu?');
            if (confirmReset) {
                document.getElementById('forgotEmail').value = username;
                showSection('forgotSection');
            }
        } else {
            alert(`❌ ${result.error}`);
        }
    }
});

// ============ XÁC THỰC 2 BƯỚC ============
document.getElementById('verifyLoginBtn').addEventListener('click', async () => {
    const code = document.getElementById('verifyCode').value.trim();
    const email = sessionStorage.getItem('loginOTPEmail');
    
    if (!code || code.length !== 6) {
        alert('❌ Vui lòng nhập mã xác thực 6 số!');
        return;
    }
    
    const result = await verifyOTP(email, code);
    
    if (result.success) {
        const pendingData = JSON.parse(sessionStorage.getItem('pendingLogin'));
        
        sessionStorage.setItem('currentUser', JSON.stringify({
            userId: pendingData.userId,
            ...pendingData.userData
        }));
        sessionStorage.setItem('userRole', pendingData.userData.role);
        
        window.location.href = 'dashboard.html';
    } else {
        alert(`❌ ${result.error}`);
    }
});

// ============ GỬI LẠI MÃ XÁC THỰC ============
document.getElementById('resendVerifyBtn').addEventListener('click', async () => {
    const email = sessionStorage.getItem('loginOTPEmail');
    const otp = generateOTP();
    await saveOTP(email, otp);
    await sendOTPEmail(email, otp);
    alert('✅ Đã gửi lại mã xác thực!');
});

// ============ MASK EMAIL ============
function maskEmail(email) {
    const parts = email.split('@');
    const username = parts[0];
    const domain = parts[1];
    const masked = username.substring(0, 3) + '***@' + domain;
    return masked;
}

// ============ QUÊN MẬT KHẨU ============
document.getElementById('sendOtpForgotBtn').addEventListener('click', async () => {
    const email = document.getElementById('forgotEmail').value.trim();
    
    if (!isValidEmail(email)) {
        alert('❌ Vui lòng nhập email hợp lệ!');
        return;
    }
    
    const user = await findUserByEmail(email);
    if (!user) {
        alert('❌ Email không tồn tại trong hệ thống!');
        return;
    }
    
    const otp = generateOTP();
    await saveOTP(email, otp);
    await sendOTPEmail(email, otp);
    
    document.getElementById('otpForgotSection').style.display = 'block';
    alert('✅ Mã OTP đã được gửi đến email của bạn!');
});

document.getElementById('resetPasswordBtn').addEventListener('click', async () => {
    const email = document.getElementById('forgotEmail').value.trim();
    const otp = document.getElementById('otpForgotCode').value.trim();
    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    
    if (!newPassword || newPassword.length < 6) {
        alert('❌ Mật khẩu tối thiểu 6 ký tự!');
        return;
    }
    
    const verifyResult = await verifyOTP(email, otp);
    
    if (verifyResult.success) {
        const user = await findUserByEmail(email);
        if (user) {
            await update(ref(database, `users/${user.userId}`), {
                password: newPassword
            });
            alert('✅ Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
            showSection('loginSection');
            document.getElementById('otpForgotSection').style.display = 'none';
            await deleteOTP(email);
        }
    } else {
        alert(`❌ ${verifyResult.error}`);
    }
});

// ============ LIÊN HỆ ADMIN ============
document.getElementById('contactAdminBtn').addEventListener('click', () => {
    window.open('mailto:admin@example.com?subject=Yêu cầu hỗ trợ đặt lại mật khẩu', '_blank');
});

// ============ PHÍM ENTER ============
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const activeSection = document.querySelector('.form-section.active');
        if (activeSection) {
            if (activeSection.id === 'registerSection') {
                document.getElementById('registerSubmitBtn').click();
            } else if (activeSection.id === 'loginSection') {
                document.getElementById('loginSubmitBtn').click();
            }
        }
    }
});

console.log('🚀 Class Web đã sẵn sàng!');
