import { database, ref, set, get, child, update, query, orderByChild, equalTo } from './firebase-config.js';

// Kiểm tra tên đăng nhập đã tồn tại chưa
export async function checkUsername(username) {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].username === username) {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Lỗi kiểm tra username:', error);
        return false;
    }
}

// Kiểm tra email đã tồn tại chưa
export async function checkEmail(email) {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].email === email) {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Lỗi kiểm tra email:', error);
        return false;
    }
}

// Đăng ký tài khoản mới
export async function registerUser(userData) {
    try {
        const usernameExists = await checkUsername(userData.username);
        if (usernameExists) {
            throw new Error('Tên đăng nhập đã tồn tại!');
        }
        
        const emailExists = await checkEmail(userData.email);
        if (emailExists) {
            throw new Error('Email đã được sử dụng!');
        }
        
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await set(ref(database, `users/${userId}`), {
            username: userData.username,
            displayName: userData.displayName,
            email: userData.email,
            password: userData.password,
            role: 'user',
            createdAt: new Date().toISOString(),
            avatar: 'default-avatar.png',
            coverImage: 'default-cover.png'
        });
        
        return { success: true, userId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Đăng nhập
export async function loginUser(username, password) {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
            throw new Error('Tài khoản không tồn tại!');
        }
        
        const users = snapshot.val();
        let foundUser = null;
        let userId = null;
        
        for (let key in users) {
            if (users[key].username === username) {
                foundUser = users[key];
                userId = key;
                break;
            }
        }
        
        if (!foundUser) {
            throw new Error('Tên đăng nhập không tồn tại!');
        }
        
        if (foundUser.password !== password) {
            throw new Error('Mật khẩu không chính xác!');
        }
        
        return {
            success: true,
            userId: userId,
            userData: foundUser
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Lấy thông tin user
export async function getUserData(userId) {
    try {
        const snapshot = await get(ref(database, `users/${userId}`));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        }
        return { success: false, error: 'Không tìm thấy user!' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Cập nhật thông tin user
export async function updateUserData(userId, data) {
    try {
        await update(ref(database, `users/${userId}`), data);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Tìm user theo email
export async function findUserByEmail(email) {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
            return null;
        }
        
        const users = snapshot.val();
        for (let key in users) {
            if (users[key].email === email) {
                return { userId: key, userData: users[key] };
            }
        }
        return null;
    } catch (error) {
        console.error('Lỗi tìm user:', error);
        return null;
    }
}
