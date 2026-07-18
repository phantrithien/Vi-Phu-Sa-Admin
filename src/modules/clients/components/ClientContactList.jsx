import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import ClientContactForm from './ClientContactForm';

const ClientContactList = ({
    contacts,
    canUpdate,
    canDelete,
    onCreate,
    onUpdate,
    onDelete,
}) => {
    const [editingId, setEditingId] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    const editingContact = contacts.find((item) => item.id === editingId) || null;

    return (
        <div className="space-y-3">
            {(canUpdate || canDelete) ? (
                <div className="flex justify-end">
                    {showCreate ? null : (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black"
                        >
                            Thêm contact
                        </button>
                    )}
                </div>
            ) : null}

            {showCreate ? (
                <ClientContactForm
                    onCancel={() => setShowCreate(false)}
                    onSubmit={async (payload) => {
                        await onCreate(payload);
                        setShowCreate(false);
                    }}
                    submitText="Tạo contact"
                />
            ) : null}

            {editingContact ? (
                <ClientContactForm
                    initialValue={editingContact}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (payload) => {
                        await onUpdate(editingContact.id, payload);
                        setEditingId(null);
                    }}
                    submitText="Cập nhật contact"
                />
            ) : null}

            {contacts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-vps-gray/20 p-4 text-sm text-vps-ivory/60">Chưa có người liên hệ.</div>
            ) : contacts.map((contact) => (
                <div key={contact.id} className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-semibold text-vps-ivory">{contact.name} {contact.isPrimary ? '(Primary)' : ''}</p>
                            <p className="text-sm text-vps-ivory/60">{contact.role || 'Không có vai trò'}</p>
                            <p className="mt-1 text-sm text-vps-ivory/70">{contact.phone || '---'} • {contact.email || '---'}</p>
                            {contact.notes ? <p className="mt-2 text-xs text-vps-ivory/60">{contact.notes}</p> : null}
                        </div>
                        {(canUpdate || canDelete) ? (
                            <div className="flex gap-2">
                                {canUpdate ? (
                                    <button
                                        onClick={() => setEditingId(contact.id)}
                                        className="rounded-lg border border-vps-gray/20 bg-[#111111] px-2 py-1.5 text-vps-ivory"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                ) : null}
                                {canDelete ? (
                                    <button
                                        onClick={() => onDelete(contact.id)}
                                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-rose-300"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClientContactList;