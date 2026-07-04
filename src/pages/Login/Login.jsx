import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/'); // Đăng nhập thành công thì đẩy về trang chủ (Dashboard)
        } catch (err) {
            console.error(err);
            setError('Email hoặc mật khẩu không chính xác. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-vps-black flex items-center justify-center p-4">
            <div className="bg-[#1E1E1E] border border-vps-gray rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl relative overflow-hidden">
                {/* Hiệu ứng ánh sáng góc */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-vps-gold/10 blur-3xl rounded-full pointer-events-none"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-vps-gold mb-2">Vị Phù Sa Media</h1>
                    <p className="text-vps-ivory opacity-60 text-sm">Hệ thống Quản trị & Kế toán Nội bộ</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm text-vps-ivory opacity-80 mb-2">Tài khoản Email</label>
                        <input
                            type="email"
                            required
                            placeholder="admin@viphusa.com"
                            className="w-full bg-[#111111] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:outline-none focus:border-vps-gold transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-vps-ivory opacity-80 mb-2">Mật khẩu</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-[#111111] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:outline-none focus:border-vps-gold transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-vps-gold hover:bg-vps-gold-hover text-vps-black font-bold py-3 rounded-lg mt-4 transition-colors flex justify-center items-center"
                    >
                        {loading ? 'Đang xác thực...' : 'Đăng Nhập Khóa Hệ Thống'}
                    </button>
                </form>

                <p className="text-center text-[10px] text-vps-ivory opacity-30 mt-8">
                    © 2026 Vi Phu Sa Media. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;