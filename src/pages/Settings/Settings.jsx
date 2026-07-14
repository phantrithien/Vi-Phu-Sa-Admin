import React from 'react';
import { Settings as SettingsIcon, ShieldCheck, UserCog } from 'lucide-react';

import AppShell from '../../components/AppShell';

const Settings = () => {
    return (
        <AppShell title="Settings" subtitle="Cau hinh he thong va governance cho MVP">
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                    <div className="mb-2 flex items-center gap-2 text-vps-gold">
                        <SettingsIcon className="h-4 w-4" />
                        <span className="text-sm font-semibold">General</span>
                    </div>
                    <p className="text-sm text-vps-ivory/60">Trang placeholder cho cai dat chung cua he thong.</p>
                </div>

                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                    <div className="mb-2 flex items-center gap-2 text-vps-gold">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-sm font-semibold">Security</span>
                    </div>
                    <p className="text-sm text-vps-ivory/60">Khu vuc quan ly quyen han va chinh sach bao mat.</p>
                </div>

                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                    <div className="mb-2 flex items-center gap-2 text-vps-gold">
                        <UserCog className="h-4 w-4" />
                        <span className="text-sm font-semibold">Organization</span>
                    </div>
                    <p className="text-sm text-vps-ivory/60">Noi dat thong tin co cau to chuc va quy trinh admin.</p>
                </div>
            </div>
        </AppShell>
    );
};

export default Settings;
