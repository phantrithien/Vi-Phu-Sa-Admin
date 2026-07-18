import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

const ClientNoteList = ({ notes, canUpdate, canDelete, onCreate, onDelete }) => {
    const [content, setContent] = useState('');

    const handleCreate = async () => {
        const value = content.trim();
        if (!value) return;
        await onCreate(value);
        setContent('');
    };

    return (
        <div className="space-y-3">
            {canUpdate ? (
                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                    <textarea
                        rows="3"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder="Thêm ghi chú chăm sóc khách hàng"
                        className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                    />
                    <div className="mt-3 flex justify-end">
                        <button onClick={handleCreate} className="rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black">Lưu ghi chú</button>
                    </div>
                </div>
            ) : null}

            {notes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-vps-gray/20 p-4 text-sm text-vps-ivory/60">Chưa có ghi chú chăm sóc khách.</div>
            ) : notes.map((item) => (
                <div key={item.id} className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3 text-sm text-vps-ivory/80">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-vps-ivory/50">{new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleString('vi-VN')}</p>
                            <p className="mt-1 text-vps-ivory">{item.content}</p>
                        </div>
                        {canDelete ? (
                            <button
                                onClick={() => onDelete(item.id)}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-rose-300"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClientNoteList;