import React, { useEffect, useState } from 'react';

import { CLIENT_STATUS_LABELS, CLIENT_STATUS_OPTIONS } from '../../../constants/clientStatus';
import { CLIENT_TYPE_LABELS, CLIENT_TYPE_OPTIONS } from '../../../constants/clientTypes';
import { getDefaultClient } from '../clientDefaults';
import { validateClientPayload } from '../clientValidators';

const getDefaultContact = () => ({
    name: '',
    role: '',
    phone: '',
    email: '',
    notes: '',
    isPrimary: true,
});

const ClientFormDrawer = ({ open, onClose, initialClient = null, onSubmit, submitting = false }) => {
    const [form, setForm] = useState(getDefaultClient());
    const [primaryContact, setPrimaryContact] = useState(getDefaultContact());
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;

        if (initialClient) {
            setForm({
                ...getDefaultClient(),
                ...initialClient,
                createdAt: initialClient.createdAt || Date.now(),
                updatedAt: initialClient.updatedAt || Date.now(),
            });
            setPrimaryContact(getDefaultContact());
            setErrors({});
            return;
        }

        setForm(getDefaultClient());
        setPrimaryContact(getDefaultContact());
        setErrors({});
    }, [open, initialClient]);

    if (!open) return null;

    const handleSubmit = (event) => {
        event.preventDefault();
        const payload = {
            ...form,
            name: String(form.name || '').trim(),
            type: form.type,
            status: form.status,
            industry: String(form.industry || '').trim(),
            source: String(form.source || '').trim(),
            phone: String(form.phone || '').trim(),
            email: String(form.email || '').trim(),
            address: String(form.address || '').trim(),
            taxCode: String(form.taxCode || '').trim(),
            notes: String(form.notes || '').trim(),
        };

        const validation = validateClientPayload(payload);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setErrors({});
        onSubmit({
            client: payload,
            primaryContact: {
                ...primaryContact,
                name: primaryContact.name.trim(),
                role: primaryContact.role.trim(),
                phone: primaryContact.phone.trim(),
                email: primaryContact.email.trim(),
                notes: primaryContact.notes.trim(),
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
            <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-vps-gray/20 bg-[#151515] p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-vps-gold/70">Client form</p>
                        <h3 className="text-xl font-semibold text-vps-ivory">{initialClient ? 'Cập nhật khách hàng' : 'Tạo khách hàng mới'}</h3>
                    </div>
                    <button onClick={onClose} className="rounded-lg bg-[#222222] px-3 py-2 text-sm text-vps-ivory">Đóng</button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm text-vps-ivory/70">Tên khách hàng *</label>
                            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                            {errors.name ? <p className="mt-1 text-xs text-rose-300">{errors.name}</p> : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm text-vps-ivory/70">Loại khách hàng *</label>
                            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                                {CLIENT_TYPE_OPTIONS.map((item) => (
                                    <option key={item} value={item}>{CLIENT_TYPE_LABELS[item]}</option>
                                ))}
                            </select>
                            {errors.type ? <p className="mt-1 text-xs text-rose-300">{errors.type}</p> : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm text-vps-ivory/70">Trạng thái *</label>
                            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                                {CLIENT_STATUS_OPTIONS.map((item) => (
                                    <option key={item} value={item}>{CLIENT_STATUS_LABELS[item]}</option>
                                ))}
                            </select>
                            {errors.status ? <p className="mt-1 text-xs text-rose-300">{errors.status}</p> : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm text-vps-ivory/70">Ngành nghề</label>
                            <input value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm text-vps-ivory/70">Nguồn khách</label>
                            <input value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm text-vps-ivory/70">Số điện thoại</label>
                            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm text-vps-ivory/70">Email</label>
                            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                            {errors.email ? <p className="mt-1 text-xs text-rose-300">{errors.email}</p> : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm text-vps-ivory/70">Mã số thuế</label>
                            <input value={form.taxCode} onChange={(event) => setForm((current) => ({ ...current, taxCode: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-vps-ivory/70">Địa chỉ</label>
                        <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-vps-ivory/70">Ghi chú</label>
                        <textarea rows="3" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                    </div>

                    <div className="rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                        <p className="text-sm font-semibold text-vps-ivory">Contact chính</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <input value={primaryContact.name} onChange={(event) => setPrimaryContact((current) => ({ ...current, name: event.target.value }))} placeholder="Tên liên hệ chính" className="w-full rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                            <input value={primaryContact.role} onChange={(event) => setPrimaryContact((current) => ({ ...current, role: event.target.value }))} placeholder="Vai trò" className="w-full rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                            <input value={primaryContact.phone} onChange={(event) => setPrimaryContact((current) => ({ ...current, phone: event.target.value }))} placeholder="Số điện thoại" className="w-full rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                            <input value={primaryContact.email} onChange={(event) => setPrimaryContact((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="w-full rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="rounded-xl border border-vps-gray/20 px-4 py-2.5 text-sm text-vps-ivory">Hủy</button>
                        <button type="submit" disabled={submitting} className="rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black disabled:cursor-not-allowed disabled:opacity-70">
                            {submitting ? 'Đang lưu...' : 'Lưu khách hàng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientFormDrawer;