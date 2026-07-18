import React from 'react';
import { Plus, Search } from 'lucide-react';

import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_OPTIONS } from '../../../constants/equipmentStatus';
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_CATEGORY_OPTIONS } from '../../../constants/equipmentCategories';

const EquipmentFilters = ({ search, onSearchChange, status, onStatusChange, category, onCategoryChange, onCreate, canCreate }) => (
    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vps-ivory/40" />
                <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Tìm theo tên, serial hoặc danh mục"
                    className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] py-2.5 pl-10 pr-3 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                />
            </div>

            <select value={status} onChange={(event) => onStatusChange(event.target.value)} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                <option value="all">Tất cả trạng thái</option>
                {EQUIPMENT_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{EQUIPMENT_STATUS_LABELS[item]}</option>)}
            </select>

            <select value={category} onChange={(event) => onCategoryChange(event.target.value)} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                <option value="all">Tất cả danh mục</option>
                {EQUIPMENT_CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{EQUIPMENT_CATEGORY_LABELS[item]}</option>)}
            </select>

            {canCreate ? (
                <button onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-vps-gold px-4 py-2.5 font-semibold text-vps-black transition-transform hover:scale-[1.01]">
                    <Plus className="h-4 w-4" />Thêm thiết bị
                </button>
            ) : null}
        </div>
    </div>
);

export default EquipmentFilters;
