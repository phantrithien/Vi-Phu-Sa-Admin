import React, { useEffect, useState } from 'react';

import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_OPTIONS } from '../../../constants/equipmentStatus';
import EquipmentCategorySelect from './EquipmentCategorySelect';

const emptyForm = {
    name: '', category: 'camera', serialNumber: '', status: 'available', condition: 'good', currentHolderId: '', notes: '',
};

const EquipmentFormDrawer = ({ open, initialEquipment, onClose, onSubmit, submitting }) => {
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (open) setForm({ ...emptyForm, ...initialEquipment });
    }, [open, initialEquipment]);

    if (!open) return null;

    const submit = (event) => {
        event.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
            <form onSubmit={submit} className="h-full w-full max-w-lg overflow-y-auto border-l border-vps-gray/20 bg-[#151515] p-6">
                <div className="flex items-center justify-between">
                    <div><p className="text-sm text-vps-gold/70">Equipment</p><h2 className="text-xl font-semibold text-vps-ivory">{initialEquipment?.id ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}</h2></div>
                    <button type="button" onClick={onClose} className="rounded-lg bg-[#222] px-3 py-2 text-sm text-vps-ivory">Đóng</button>
                </div>

                <div className="mt-6 space-y-4">
                    <label className="block text-sm text-vps-ivory/70">Tên thiết bị<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm text-vps-ivory/70">Danh mục<div className="mt-2"><EquipmentCategorySelect value={form.category} onChange={(category) => setForm({ ...form, category })} /></div></label>
                        <label className="text-sm text-vps-ivory/70">Trạng thái<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold">{EQUIPMENT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{EQUIPMENT_STATUS_LABELS[status]}</option>)}</select></label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm text-vps-ivory/70">Serial number<input value={form.serialNumber} onChange={(event) => setForm({ ...form, serialNumber: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                        <label className="text-sm text-vps-ivory/70">Tình trạng<input value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    </div>

                    <label className="block text-sm text-vps-ivory/70">Người đang giữ (ID)<input value={form.currentHolderId} onChange={(event) => setForm({ ...form, currentHolderId: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    <label className="block text-sm text-vps-ivory/70">Ghi chú<textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-xl border border-vps-gray/20 px-4 py-2.5 text-sm text-vps-ivory">Hủy</button>
                    <button disabled={submitting} className="rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black disabled:opacity-60">{submitting ? 'Đang lưu...' : 'Lưu thiết bị'}</button>
                </div>
            </form>
        </div>
    );
};

export default EquipmentFormDrawer;
