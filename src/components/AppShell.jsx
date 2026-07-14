import React from 'react';
import Sidebar from './Sidebar';

const AppShell = ({ title, subtitle, children, actions }) => {
    return (
        <div className="min-h-screen bg-[#0F0F0F] flex w-full max-w-[100vw] overflow-x-hidden relative text-vps-ivory">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <header className="rounded-2xl border border-vps-gray/30 bg-[#141414] px-5 py-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-vps-gold/70">Internal Operating System</p>
                                <h1 className="text-2xl font-semibold text-vps-ivory">{title}</h1>
                                {subtitle ? <p className="mt-1 text-sm text-vps-ivory/60">{subtitle}</p> : null}
                            </div>
                            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
                        </div>
                    </header>

                    <div className="rounded-2xl border border-vps-gray/20 bg-[#111111] p-4 sm:p-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AppShell;
