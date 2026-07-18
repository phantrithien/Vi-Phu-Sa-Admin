import React, { useState } from 'react';
import { Plus } from 'lucide-react';

import { CREW_ROLE_LABELS } from '../../../constants/crewRoles';

const CrewAssignmentPicker = ({ crewOptions = [], onAssign }) => {
    const [crewId, setCrewId] = useState('');
    const [role, setRole] = useState('');
    const [rate, setRate] = useState(0);

    const selectedCrew = crewOptions.find((item) => item.id === crewId);

    const submit = async (event) => {
        event.preventDefault();
        if (!crewId) return;
        await onAssign({ crewId, role: role || (selectedCrew?.roles || [])[0] || '', rate: Number(rate || selectedCrew?.dayRate || 0) });
        setCrewId('');
        setRole('');
        setRate(0);
    };

    return (
        <form onSubmit={submit} className="rounded-xl border border-vps-gray/20 bg-[#181818] p-3">
            <div className="grid gap-3 sm:grid-cols-3">
                <select
                    value={crewId}
                    onChange={(event) => { setCrewId(event.target.value); const found = crewOptions.find((item) => item.id === event.target.value); setRate(found?.dayRate || 0); }}
                    className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                >
                    <option value="">Chọn crew</option>
                    {crewOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <input
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder={selectedCrew ? CREW_ROLE_LABELS[(selectedCrew.roles || [])[0]] || 'Vai trò' : 'Vai trò'}
                    className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                />
                <input
                    type="number"
                    min="0"
                    value={rate}
                    onChange={(event) => setRate(Number(event.target.value))}
                    className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                />
            </div>
            <div className="mt-3 flex justify-end">
                <button disabled={!crewId} className="inline-flex items-center gap-2 rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black disabled:opacity-60">
                    <Plus className="h-4 w-4" />Gán crew
                </button>
            </div>
        </form>
    );
};

export default CrewAssignmentPicker;
