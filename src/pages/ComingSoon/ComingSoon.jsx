import React from 'react';
import Sidebar from '../../components/Sidebar';
import { Hammer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title, description }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-vps-black flex">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 overflow-y-auto flex items-center justify-center">

                <div className="bg-[#1E1E1E] border border-vps-gray p-10 rounded-2xl shadow-2xl text-center max-w-lg w-full relative overflow-hidden">
                    {/* Hiệu ứng ánh sáng */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-vps-gold/10 blur-3xl rounded-full pointer-events-none"></div>

                    <div className="w-20 h-20 bg-[#111] border border-vps-gray rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Hammer className="w-8 h-8 text-vps-gold" />
                    </div>

                    <h1 className="text-3xl font-serif font-bold text-vps-gold mb-3">{title}</h1>
                    <p className="text-vps-ivory opacity-60 mb-8 leading-relaxed">
                        {description || 'Phân hệ này đang trong quá trình thiết kế và sẽ sớm được cập nhật trong các phiên bản tiếp theo của hệ thống.'}
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-[#111] border border-vps-gray text-vps-ivory hover:text-vps-gold hover:border-vps-gold transition-colors rounded-lg font-medium"
                    >
                        Quay lại Tổng quan
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ComingSoon;