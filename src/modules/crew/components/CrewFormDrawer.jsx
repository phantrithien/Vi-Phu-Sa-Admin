import React, { useEffect, useState } from 'react';

import { CREW_STATUS_LABELS, CREW_STATUS_OPTIONS } from '../../../constants/crewStatus';
import { CREW_TYPE_LABELS, CREW_TYPE_OPTIONS } from '../crewDefaults';
import CrewRateInput from './CrewRateInput';
import CrewRoleSelector from './CrewRoleSelector';

const emptyForm = {
    name: '', type: 'freelancer', roles: [], skills: '', dayRate: 0, phone: '', email: '', status: 'available', notes: '',
};

const CrewFormDrawer = ({ open, initialCrew, onClose, onSubmit, submitting }) => {
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (!open) return;
        if (initialCrew) {
            setForm({ ...emptyForm, ...initialCrew, skills: (initialCrew.skills || []).join(', ') });
        } else {
            setForm(emptyForm);
        }
    }, [open, initialCrew]);

    if (!open) return null;

    const submit = (event) => {
        event.preventDefault();
        onSubmit({
            ...form,
            skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
            <form onSubmit={submit} className="h-full w-full max-w-lg overflow-y-auto border-l border-vps-gray/20 bg-[#151515] p-6">
                <div className="flex items-center justify-between">
                    <div><p className="text-sm text-vps-gold/70">Crew</p><h2 className="text-xl font-semibold text-vps-ivory">{initialCrew?.id ? 'Cập nhật crew' : 'Tạo crew mới'}</h2></div>
                    <button type="button" onClick={onClose} className="rounded-lg bg-[#222] px-3 py-2 text-sm text-vps-ivory">Đóng</button>
                </div>

                <div className="mt-6 space-y-4">
                    <label className="block text-sm text-vps-ivory/70">Tên<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm text-vps-ivory/70">Loại<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold">{CREW_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{CREW_TYPE_LABELS[type]}</option>)}</select></label>
                        <label className="text-sm text-vps-ivory/70">Trạng thái<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold">{CREW_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{CREW_STATUS_LABELS[status]}</option>)}</select></label>
                    </div>

                    <div>
                        <p className="mb-2 text-sm text-vps-ivory/70">Vai trò</p>
                        <CrewRoleSelector value={form.roles} onChange={(roles) => setForm({ ...form, roles })} />
                    </div>

                    <label className="block text-sm text-vps-ivory/70">Kỹ năng (phân cách dấu phẩy)<input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm text-vps-ivory/70">Rate/ngày<div className="mt-2"><CrewRateInput value={form.dayRate} onChange={(dayRate) => setForm({ ...form, dayRate })} /></div></label>
                        <label className="text-sm text-vps-ivory/70">Điện thoại<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    </div>

                    <label className="block text-sm text-vps-ivory/70">Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                    <label className="block text-sm text-vps-ivory/70">Ghi chú<textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold" /></label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-xl border border-vps-gray/20 px-4 py-2.5 text-sm text-vps-ivory">Hủy</button>
                    <button disabled={submitting} className="rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black disabled:opacity-60">{submitting ? 'Đang lưu...' : 'Lưu crew'}</button>
                </div>
            </form>
        </div>
    );
};

export default CrewFormDrawer;
