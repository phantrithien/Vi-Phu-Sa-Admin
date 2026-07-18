import React, { useState } from 'react';
import { Trash2, Wrench } from 'lucide-react';

const emptyForm = { type: 'maintenance', description: '', date: '' };

const EquipmentMaintenanceLog = ({ logs = [], canManage, onCreate, onDelete }) => {
    const [form, setForm] = useState(emptyForm);

    const submit = async (event) => {
        event.preventDefault();
        await onCreate(form);
        setForm(emptyForm);
    };

    return (
        <div className="space-y-4">
            {canManage ? (
                <form onSubmit={submit} className="rounded-xl border border-vps-gray/20 bg-[#181818] p-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                            <option value="maintenance">Bảo trì</option>
                            <option value="damage">Hư hỏng</option>
                            <option value="lost">Thất lạc</option>
                        </select>
                        <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                        <input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Mô tả" className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                    </div>
                    <div className="mt-3 flex justify-end"><button className="inline-flex items-center gap-2 rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black"><Wrench className="h-4 w-4" />Ghi log</button></div>
                </form>
            ) : null}

            {logs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-vps-gray/30 p-4 text-sm text-vps-ivory/60">Chưa có log bảo trì/hư hỏng.</div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory/80">
                            <div><p className="font-medium text-vps-ivory">{log.type === 'damage' ? 'Hư hỏng' : log.type === 'lost' ? 'Thất lạc' : 'Bảo trì'} · {log.date || '---'}</p><p className="text-xs text-vps-ivory/60">{log.description}</p></div>
                            {canManage ? <button onClick={() => onDelete(log.id)} className="text-rose-300"><Trash2 className="h-4 w-4" /></button> : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EquipmentMaintenanceLog;
