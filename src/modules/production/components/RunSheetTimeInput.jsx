import React from 'react';

const RunSheetTimeInput = ({ value, onChange }) => <input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold" />;

export default RunSheetTimeInput;