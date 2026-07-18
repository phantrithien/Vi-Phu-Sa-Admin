import React, { useEffect, useState } from 'react';

const initialForm = {
    name: '',
    role: '',
    phone: '',
    email: '',
    notes: '',
    isPrimary: false,
};

const ClientContactForm = ({ initialValue = null, onSubmit, onCancel, submitText = 'Lưu contact' }) => {
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        if (initialValue) {
            setForm({
                name: initialValue.name || '',
                role: initialValue.role || '',
                phone: initialValue.phone || '',
                email: initialValue.email || '',
                notes: initialValue.notes || '',
                isPrimary: Boolean(initialValue.isPrimary),
            });
            return;
        }
        setForm(initialForm);
    }, [initialValue]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({
            ...form,
            name: form.name.trim(),
            role: form.role.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            notes: form.notes.trim(),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
            <div className="grid gap-3 md:grid-cols-2">
                <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    placeholder="Tên người liên hệ"
                    className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                />
                <input
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                    placeholder="Vai trò"
                    className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                />
                <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Số điện thoại"
                    className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                />
                <input
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Email"
                    className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                />
            </div>
            <textarea
                rows="2"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Ghi chú liên hệ"
                className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
            />
            <label className="inline-flex items-center gap-2 text-sm text-vps-ivory/70">
                <input
                    type="checkbox"
                    checked={form.isPrimary}
                    onChange={(event) => setForm((current) => ({ ...current, isPrimary: event.target.checked }))}
                    className="h-4 w-4 accent-vps-gold"
                />
                Đặt làm contact chính
            </label>
            <div className="flex justify-end gap-2">
                {onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-vps-gray/20 px-3 py-2 text-sm text-vps-ivory"
                    >
                        Hủy
                    </button>
                ) : null}
                <button
                    type="submit"
                    className="rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black"
                >
                    {submitText}
                </button>
            </div>
        </form>
    );
};

export default ClientContactForm;