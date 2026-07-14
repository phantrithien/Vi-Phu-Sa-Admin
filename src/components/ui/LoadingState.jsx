import React from 'react';

const LoadingState = ({ title = 'Đang tải dữ liệu', description = 'Vui lòng chờ trong giây lát.' }) => {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-vps-gray/30 bg-[#111111] p-8 text-center">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-vps-gold/30 border-t-vps-gold" />
            <h3 className="text-lg font-semibold text-vps-ivory">{title}</h3>
            <p className="mt-2 max-w-md text-sm text-vps-ivory/60">{description}</p>
        </div>
    );
};

export default LoadingState;
