import { 
    checkUsername, checkEmail, registerUser, loginUser, getUserData 
} from './auth.js';
import { 
    generateOTP, saveOTP, verifyOTP, sendOTPEmail, deleteOTP, getOTP 
} from './otp.js';

// DOM Elements
const registerSection = document.getElementById('registerSection');
const loginSection = document.getElementById('loginSection');
const forgotSection = document.getElementById('forgotSection');
const verifySection = document.getElementById('verifySection');

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const forgotForm = document.getElementById('forgotForm');

const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const displayNameInput = document.getElementById('displayName');
const otpCodeInput = document.getElementById('otpCode');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const otpSection = document.getElementById('otpSection');
const otpTimer = document.getElementById('otpTimer');
const otpStatus = document.getElementById('otpStatus');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const loginMessage = document.createElement('div');

const switchToLogin = document.getElementById('switchToLogin');
const switchToRegister = document.getElementById('switchToRegister');
const backToLogin = document.getElementById('backToLogin');

// State
let currentEmail = '';
let currentUsername = '';
let otpTimerInterval = null;
let isOTPSent = false;
let pendingUserData = null;
let pendingLoginUser = null;

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
        document.getElementById('usernameStatus').textContent = 'Tên đăng nhập tối thiểu 3 ký tự!';
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
        currentUsername = username;
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
        otpStatus.textContent = '❌ Vui lòng nhập email hợp lệ!';
        otpStatus.className = 'status-text error';
        return;
    }
    
    // Kiểm tra email đã tồn tại
    const exists = await checkEmail(email);
    if (exists) {
        otpStatus.textContent = '❌ Email đã được sử dụng!';
        otpStatus.className = 'status-text error';
        return;
    }
    
    // Tạo OTP
    const otp = generateOTP();
    const saveResult = await saveOTP(email, otp);
    
    if (!saveResult.success) {
        otpStatus.textContent = '❌ Lỗi lưu OTP!';
        otpStatus.className = 'status-text error';
        return;
    }
    
    // Gửi OTP
    const sendResult = await sendOTPEmail(email, otp);
    
    if (sendResult.success) {
        otpStatus.textContent = '✅ Mã OTP đã được gửi đến email của bạn!';
        otpStatus.className = 'status-text success';
        isOTPSent = true;
        otpSection.style.display = 'block';
        startOTPTimer();
    } else {
        otpStatus.textContent = '❌ Gửi OTP thất bại!';
        otpStatus.className = 'status-text error';
    }
});

// ============ TIMER OTP ============
function startOTPTimer() {
    let seconds = 60;
    sendOtpBtn.disabled = true;
    otpTimer.textContent = `⏳ ${seconds}s`;
    
    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
        seconds--;
        otpTimer.textContent = `⏳ ${seconds}s`;
        
        if (seconds <= 0) {
            clearInterval(otpTimerInterval);
            sendOtpBtn.disabled = false;
            otpTimer.textContent = '✅ Có thể gửi lại mã';
        }
    }, 1000);
}

// ============ XÁC NHẬN OTP ============
verifyOtpBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const otp = otpCodeInput.value.trim();
    if (otp.length !== 6) {
        otpStatus.textContent = '❌ Vui lòng nhập đủ 6 số!';
        otpStatus.className = 'status-text error';
        return;
    }
    
    const result = await verifyOTP(currentEmail, otp);
    
    if (result.success) {
        otpStatus.textContent = '✅ Xác thực thành công!';
        otpStatus.className = 'status-text success';
        
        // Chuyển sang bước đăng ký
        await handleRegistration();
    } else {
        otpStatus.textContent = `❌ ${result.error}`;
        otpStatus.className = 'status-text error';
    }
});

// ============ ĐĂNG KÝ ============
async function handleRegistration() {
    const displayName = displayNameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!displayName || !username || !email || !password) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    
    if (password.length < 6) {
        alert('Mật khẩu tối thiểu 6 ký tự!');
        return;
    }
    
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
        registerForm.reset();
        otpSection.style.display = 'none';
        document.getElementById('usernameStatus').textContent = '';
        document.getElementById('emailStatus').textContent = '';
        document.getElementById('otpStatus').textContent = '';
        usernameInput.classList.remove('success', 'error');
        emailInput.classList.remove('success', 'error');
        
        // Xóa OTP
        await deleteOTP(email);
    } else {
        alert(`❌ ${result.error}`);
    }
}

// ============ ĐĂNG NHẬP ============
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    if (!username || !password) {
        alert('Vui lòng nhập tên đăng nhập và mật khẩu!');
        return;
    }
    
    const result = await loginUser(username, password);
    
    if (result.success) {
        pendingLoginUser = result;
        
        // Lưu thông tin đăng nhập để xác thực 2 bước
        sessionStorage.setItem('pendingLogin', JSON.stringify({
            userId: result.userId,
            email: result.userData.email
        }));
        
        // Hiển thị phần xác thực 2 bước
        const maskedEmail = maskEmail(result.userData.email);
        document.getElementById('verifyMessage').textContent = 
            `Chúng tôi đã gửi mã về email ${maskedEmail}, bạn hãy kiểm tra hộp thư để hoàn thành việc đăng nhập`;
        
        showSection('verifySection');
        
        // Gửi OTP xác thực đăng nhập
        const otp = generateOTP();
        await saveOTP(result.userData.email, otp);
        await sendOTPEmail(result.userData.email, otp);
        
        // Lưu user để xác th
