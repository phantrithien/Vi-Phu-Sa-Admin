import React, { useState } from 'react';
import { Plus } from 'lucide-react';

import { checkBookingConflict } from '../equipmentBookingService';
import EquipmentBookingConflictWarning from './EquipmentBookingConflictWarning';

const EquipmentBookingDrawer = ({ equipmentOptions = [], defaultStartDate = '', defaultEndDate = '', onSubmit }) => {
    const [equipmentId, setEquipmentId] = useState('');
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate || defaultStartDate);
    const [notes, setNotes] = useState('');
    const [conflict, setConflict] = useState(false);
    const [checking, setChecking] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        if (!equipmentId || !startDate) return;

        setChecking(true);
        try {
            const hasConflict = await checkBookingConflict(equipmentId, startDate, endDate || startDate);
            if (hasConflict) {
                setConflict(true);
                return;
            }

            await onSubmit({ equipmentId, startDate, endDate: endDate || startDate, notes });
            setEquipmentId('');
            setNotes('');
            setConflict(false);
        } finally {
            setChecking(false);
        }
    };

    return (
        <form onSubmit={submit} className="rounded-xl border border-vps-gray/20 bg-[#181818] p-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <select value={equipmentId} onChange={(event) => { setEquipmentId(event.target.value); setConflict(false); }} className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                    <option value="">Chọn thiết bị</option>
                    {equipmentOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ghi chú" className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                <input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setConflict(false); }} className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                <input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setConflict(false); }} className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
            </div>

            <div className="mt-3"><EquipmentBookingConflictWarning visible={conflict} /></div>

            <div className="mt-3 flex justify-end">
                <button disabled={!equipmentId || !startDate || checking} className="inline-flex items-center gap-2 rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black disabled:opacity-60">
                    <Plus className="h-4 w-4" />{checking ? 'Đang kiểm tra...' : 'Đặt thiết bị'}
                </button>
            </div>
        </form>
    );
};

export default EquipmentBookingDrawer;
