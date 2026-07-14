import React from 'react';
import AppShell from '../../components/AppShell';
import { Hammer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title, description }) => {
    const navigate = useNavigate();

    return (
        <AppShell title={title || 'Coming soon'} subtitle={description || 'Phân hệ đang được thiết kế cho sprint tiếp theo.'}>
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="max-w-2xl w-full bg-[#1A1A1A] border border-vps-gray/30 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-56 h-56 bg-vps-gold/10 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-vps-gold/10 border border-vps-gold/30 flex items-center justify-center mx-auto mb-6">
                            <Hammer className="w-8 h-8 text-vps-gold" />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-vps-gold mb-4">
                            {title}
                        </h1>

                        <p className="text-vps-ivory/65 leading-relaxed mb-8">
                            {description ||
                                'Phân hệ này đang trong quá trình thiết kế theo kiến trúc Internal Operating System và sẽ được phát triển ở các sprint tiếp theo.'}
                        </p>

                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-[#111] border border-vps-gray text-vps-ivory hover:text-vps-gold hover:border-vps-gold transition-colors rounded-xl font-medium"
                        >
                            Quay lại Command Center
                        </button>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

export default ComingSoon;