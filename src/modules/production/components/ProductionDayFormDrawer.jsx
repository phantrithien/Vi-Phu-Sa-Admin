import React, { useEffect, useState } from 'react';

import { PRODUCTION_STATUS_LABELS, PRODUCTION_STATUS_OPTIONS } from '../../../constants/productionStatus';
import { PRODUCTION_TYPE_LABELS, PRODUCTION_TYPE_OPTIONS } from '../../../constants/productionTypes';

const emptyForm = {
    title: '', date: '', type: 'shooting', location: '', callTime: '', wrapTime: '', status: 'draft', notes: '',
};

const ProductionDayFormDrawer = ({ open, initialValue, onClose, onSubmit, saving }) => {
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (open) setForm({ ...emptyForm, ...initialValue });
    }, [open, initialValue]);

    if (!open) return null;

    const submit = (event) => {
        event.preventDefault();
        onSubmit(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, String(value || '').trim()])));
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
            <form onSubmit={submit} className="h-full w-full max-w-lg overflow-y-auto border-l border-vps-gray/20 bg-[#151515] p-6">
                <div className="flex items-center justify-between">
                    <div><p className="text-sm text-vps-gold/70">Production plan</p><h2 className="text-xl font-semibold text-vps-ivory">{initialValue?.id ? 'Cập nhật ngày sản xuất' : 'Tạo ngày sản xuất'}</h2></div>
                    <button type="button" onClick={onClose} className="rounded-lg bg-[#222] px-3 py-2 text-sm text-vps-ivory">Đóng</button>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-vps-ivory/70 sm:col-span-2">Tên buổi sản xuất<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    <label className="text-sm text-vps-ivory/70">Ngày<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    <label className="text-sm text-vps-ivory/70">Loại<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold">{PRODUCTION_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{PRODUCTION_TYPE_LABELS[type]}</option>)}</select></label>
                    <label className="text-sm text-vps-ivory/70 sm:col-span-2">Địa điểm<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    <label className="text-sm text-vps-ivory/70">Call time<input type="time" value={form.callTime} onChange={(event) => setForm({ ...form, callTime: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    <label className="text-sm text-vps-ivory/70">Wrap time<input type="time" value={form.wrapTime} onChange={(event) => setForm({ ...form, wrapTime: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    <label className="text-sm text-vps-ivory/70 sm:col-span-2">Trạng thái<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold">{PRODUCTION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{PRODUCTION_STATUS_LABELS[status]}</option>)}</select></label>
                    <label className="text-sm text-vps-ivory/70 sm:col-span-2">Ghi chú<textarea rows="4" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                </div>
                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-vps-gray/20 px-4 py-2.5 text-sm text-vps-ivory">Hủy</button><button disabled={saving} className="rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu ngày sản xuất'}</button></div>
            </form>
        </div>
    );
};

export default ProductionDayFormDrawer;