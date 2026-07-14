import React, { useEffect, useMemo, useState } from 'react';
import { Archive as ArchiveIcon, BookText, FileText, FolderArchive, Search } from 'lucide-react';

import AppShell from '../../components/AppShell';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import { useToast } from '../../components/ui/ToastProvider';
import { listArchives, updateArchivePostMortem } from '../../services/archiveService';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const initialPostMortem = {
    whatWentWell: '',
    whatWentWrong: '',
    lessonsLearned: '',
};

const Archive = () => {
    const { pushToast } = useToast();
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [postMortem, setPostMortem] = useState(initialPostMortem);

    const loadArchives = async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await listArchives();
            setArchives(rows);
            if (rows.length > 0 && !activeId) {
                setActiveId(rows[0].id);
            }
        } catch (err) {
            setError(err.message || 'Không thể tải archive.');
            pushToast(err.message || 'Không thể tải archive.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchives();
    }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return archives;

        return archives.filter((item) =>
            [item.projectTitle, item.client, item.producer, item.summary]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(term)
        );
    }, [archives, search]);

    const activeArchive = useMemo(
        () => filtered.find((item) => item.id === activeId) || filtered[0] || null,
        [filtered, activeId]
    );

    useEffect(() => {
        if (activeArchive?.postMortem) {
            setPostMortem({
                whatWentWell: activeArchive.postMortem.whatWentWell || '',
                whatWentWrong: activeArchive.postMortem.whatWentWrong || '',
                lessonsLearned: activeArchive.postMortem.lessonsLearned || '',
            });
        } else {
            setPostMortem(initialPostMortem);
        }
    }, [activeArchive]);

    const savePostMortem = async () => {
        if (!activeArchive) return;
        try {
            await updateArchivePostMortem(activeArchive.id, postMortem);
            await loadArchives();
            pushToast('Luu post-mortem thanh cong.', 'success');
        } catch (err) {
            setError(err.message || 'Không thể lưu post-mortem.');
            pushToast(err.message || 'Không thể lưu post-mortem.', 'error');
        }
    };

    return (
        <AppShell title="Archive" subtitle="Lưu trữ project và post-mortem vận hành">
            <div className="space-y-4">
                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vps-ivory/40" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm archive theo project, client, producer"
                            className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] py-2.5 pl-10 pr-3 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                        />
                    </div>
                </div>

                {loading ? (
                    <LoadingState title="Đang tải archive" description="Đang đồng bộ dữ liệu archive từ Firestore." />
                ) : error ? (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>
                ) : filtered.length === 0 ? (
                    <EmptyState title="Chưa có archive nào" description="Tạo archive từ trang Project để xem chi tiết và post-mortem." />
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="space-y-3">
                            {filtered.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveId(item.id)}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${activeArchive?.id === item.id
                                        ? 'border-vps-gold/40 bg-vps-gold/10'
                                        : 'border-vps-gray/20 bg-[#181818] hover:border-vps-gray/40'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 text-vps-gold">
                                        <FolderArchive className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-[0.3em]">Archived project</span>
                                    </div>
                                    <h3 className="mt-2 text-base font-semibold text-vps-ivory">{item.projectTitle}</h3>
                                    <p className="mt-1 text-xs text-vps-ivory/60">{item.client} • {item.producer}</p>
                                </button>
                            ))}
                        </div>

                        {activeArchive ? (
                            <div className="rounded-3xl border border-vps-gray/20 bg-[#151515] p-5">
                                <div className="flex items-center gap-2 text-vps-gold">
                                    <ArchiveIcon className="h-4 w-4" />
                                    <span className="text-xs uppercase tracking-[0.3em]">Archive detail</span>
                                </div>
                                <h3 className="mt-2 text-xl font-semibold text-vps-ivory">{activeArchive.projectTitle}</h3>
                                <p className="mt-2 text-sm text-vps-ivory/60">{activeArchive.summary || 'Chưa có summary.'}</p>

                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-vps-gray/20 bg-[#181818] p-3">
                                        <p className="text-xs uppercase tracking-wider text-vps-ivory/60">Revenue</p>
                                        <p className="mt-1 text-base font-semibold text-emerald-400">{formatMoney(activeArchive.finance?.revenue)}</p>
                                    </div>
                                    <div className="rounded-xl border border-vps-gray/20 bg-[#181818] p-3">
                                        <p className="text-xs uppercase tracking-wider text-vps-ivory/60">Cost</p>
                                        <p className="mt-1 text-base font-semibold text-rose-400">{formatMoney(activeArchive.finance?.cost)}</p>
                                    </div>
                                    <div className="rounded-xl border border-vps-gray/20 bg-[#181818] p-3">
                                        <p className="text-xs uppercase tracking-wider text-vps-ivory/60">Profit</p>
                                        <p className="mt-1 text-base font-semibold text-vps-gold">{formatMoney(activeArchive.finance?.profit)}</p>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                                    <div className="flex items-center gap-2 text-vps-gold">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">File links</span>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {(activeArchive.fileLinks || []).length === 0 ? (
                                            <p className="text-sm text-vps-ivory/60">Không có file link.</p>
                                        ) : (activeArchive.fileLinks || []).map((item, index) => (
                                            <div key={`${item.url}-${index}`} className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm">
                                                <p className="font-semibold text-vps-ivory">{item.title || 'Untitled'}</p>
                                                <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-vps-gold underline">{item.url}</a>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-5 rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                                    <div className="flex items-center gap-2 text-vps-gold">
                                        <BookText className="h-4 w-4" />
                                        <span className="text-sm">Post-mortem</span>
                                    </div>
                                    <div className="mt-3 space-y-3">
                                        <textarea
                                            rows="3"
                                            value={postMortem.whatWentWell}
                                            onChange={(event) => setPostMortem((current) => ({ ...current, whatWentWell: event.target.value }))}
                                            placeholder="Điều đã làm tốt"
                                            className="w-full rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                        />
                                        <textarea
                                            rows="3"
                                            value={postMortem.whatWentWrong}
                                            onChange={(event) => setPostMortem((current) => ({ ...current, whatWentWrong: event.target.value }))}
                                            placeholder="Điều chưa tốt"
                                            className="w-full rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                        />
                                        <textarea
                                            rows="3"
                                            value={postMortem.lessonsLearned}
                                            onChange={(event) => setPostMortem((current) => ({ ...current, lessonsLearned: event.target.value }))}
                                            placeholder="Bài học rút ra"
                                            className="w-full rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                        />
                                        <div className="flex justify-end">
                                            <button onClick={savePostMortem} className="rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black">Lưu post-mortem</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default Archive;
