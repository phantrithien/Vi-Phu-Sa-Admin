import React from 'react';

import { CREW_ROLE_LABELS, CREW_ROLE_OPTIONS } from '../../../constants/crewRoles';

const CrewRoleSelector = ({ value = [], onChange }) => {
    const toggleRole = (role) => {
        if (value.includes(role)) onChange(value.filter((item) => item !== role));
        else onChange([...value, role]);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {CREW_ROLE_OPTIONS.map((role) => (
                <button
                    type="button"
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${value.includes(role) ? 'bg-vps-gold text-vps-black' : 'bg-[#222222] text-vps-ivory/70'}`}
                >
                    {CREW_ROLE_LABELS[role]}
                </button>
            ))}
        </div>
    );
};

export default CrewRoleSelector;
