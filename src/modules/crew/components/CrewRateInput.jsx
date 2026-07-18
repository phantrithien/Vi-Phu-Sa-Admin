import React from 'react';

const CrewRateInput = ({ value, onChange }) => (
    <div className="relative">
        <input
            type="number"
            min="0"
            step="50000"
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 pr-12 text-sm text-vps-ivory outline-none focus:border-vps-gold"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-vps-ivory/50">đ/ngày</span>
    </div>
);

export default CrewRateInput;
