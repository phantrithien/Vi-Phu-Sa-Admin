import React from 'react';

import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_CATEGORY_OPTIONS } from '../../../constants/equipmentCategories';

const EquipmentCategorySelect = ({ value, onChange }) => (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
        {EQUIPMENT_CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{EQUIPMENT_CATEGORY_LABELS[category]}</option>)}
    </select>
);

export default EquipmentCategorySelect;
