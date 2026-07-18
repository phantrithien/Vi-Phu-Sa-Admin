import React from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';

const ClientProjectHistory = ({ projects, onOpenProject }) => {
    if (!projects.length) {
        return (
            <div className="rounded-2xl border border-dashed border-vps-gray/20 p-4 text-sm text-vps-ivory/60">
                Khách hàng chưa có project nào.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {projects.map((project) => (
                <div key={project.id} className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-semibold text-vps-ivory">{project.title}</p>
                            <p className="text-sm text-vps-ivory/60">{project.code || 'PRJ-NEW'} • {project.status || 'planning'}</p>
                            <p className="mt-1 inline-flex items-center gap-2 text-xs text-vps-ivory/60">
                                <CalendarDays className="h-3.5 w-3.5 text-vps-gold" />
                                {project.startDate || '---'}
                            </p>
                        </div>
                        <button
                            onClick={() => onOpenProject(project)}
                            className="inline-flex items-center gap-2 rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Mở project
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClientProjectHistory;