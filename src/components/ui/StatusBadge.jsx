import React from 'react';

const variants = {
    neutral: 'bg-[#1E1E1E] text-vps-ivory border-vps-gray/40',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-vps-gold/10 text-vps-gold border-vps-gold/30',
};

const StatusBadge = ({ label, variant = 'neutral' }) => {
    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${variants[variant] || variants.neutral}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
