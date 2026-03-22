import React, { useState, useEffect, useCallback } from 'react';
import UserBar from '../components/UserBar';
import api from '../services/api';
import {
    BarChart3, Users, FileText, AlertTriangle, CheckCircle2, XCircle,
    Download, Search, ChevronLeft, ChevronRight, Loader2, Eye,
    Clock, Shield, Trash2, Edit3, X, Link2, Calendar, MapPin, Building2,
    FileSearch
} from 'lucide-react';

const STATUS_COLORS = {
    pending: 'bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider',
    matched: 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider',
    claimed: 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider',
    returned: 'bg-gray-500/20 text-gray-400 border border-gray-500/30 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider',
    expired: 'bg-gray-800 text-gray-400 border border-gray-700 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider',
};

const CLAIM_COLORS = {
    pending: 'bg-accent/20 text-accent',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
};

const AdminDashboard = () => {
    console.log('AdminDashboard component mounting...');

    // ── State ───────────────────────────────────────
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [meta, setMeta] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    // Filters
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCampus, setFilterCampus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Detail panel
    const [selectedReport, setSelectedReport] = useState(null);

    // Action feedback
    const [actionMessage, setActionMessage] = useState('');

    // Admin tabs
    const [adminTab, setAdminTab] = useState('reports');

    // Export state
    const [exportPeriod, setExportPeriod] = useState('all');
    const [exportDateFrom, setExportDateFrom] = useState('');
    const [exportDateTo, setExportDateTo] = useState('');
    const [exportPreview, setExportPreview] = useState([]);
    const [exportPreviewMeta, setExportPreviewMeta] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);

    // Matches state
    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);

    // Claims History state
    const [historyClaims, setHistoryClaims] = useState([]);
    const [historyClaimsMeta, setHistoryClaimsMeta] = useState({});
    const [claimsLoading, setClaimsLoading] = useState(false);
    const [claimSearch, setClaimSearch] = useState('');
    const [claimStatus, setClaimStatus] = useState('');
    const [claimPage, setClaimPage] = useState(1);
    
    // expand tracking
    const [expandedProofs, setExpandedProofs] = useState({});

    // ── Data Fetching ───────────────────────────────

    const fetchStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const { data } = await api.get('/admin/stats');
            const s = data.stats || {};
            const byStatus = data.reports_by_status || {};
            setStats({
                reports: {
                    total: s.total_reports ?? 0,
                    by_type: {
                        lost: s.lost_reports ?? 0,
                        found: s.found_reports ?? 0,
                    },
                    by_status: {
                        pending: byStatus.pending ?? 0,
                        matched: byStatus.matched ?? 0,
                        claimed: byStatus.claimed ?? 0,
                        returned: byStatus.returned ?? 0,
                    },
                },
                users: { total: s.total_users ?? 0 },
                claims: {
                    by_status: {
                        pending: s.pending_claims ?? 0,
                        approved: s.approved_claims ?? 0,
                        rejected: s.rejected_claims ?? 0,
                    },
                },
                recent_activity: (data.recent_activity || []).map(log => ({
                    ...log,
                    user: typeof log.user === 'string' ? { name: log.user } : log.user,
                })),
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchReports = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            const params = { page };
            if (filterType) params.type = filterType;
            if (filterStatus) params.status = filterStatus;
            if (filterCampus) params.campus = filterCampus;
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const { data } = await api.get('/admin/reports', { params });
            setReports(data.data);
            setMeta(data.meta);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filterType, filterStatus, filterCampus, searchQuery]);

    const fetchMatches = useCallback(async () => {
        try {
            setMatchesLoading(true);
            const response = await api.get('/admin/matches');
            const matches = response.data?.data || [];
            setMatches(matches);
        } catch (err) {
            console.error('Error fetching matches:', err);
            setMatches([]);
        } finally {
            setMatchesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        setCurrentPage(1);
        fetchReports(1);
    }, [fetchReports]);

    useEffect(() => {
        if (adminTab === 'matches') {
            fetchMatches();
        }
    }, [adminTab, fetchMatches]);

    const fetchClaimsHistory = useCallback(async (page = 1) => {
        try {
            setClaimsLoading(true);
            const params = { page };
            if (claimSearch.trim()) params.search = claimSearch.trim();
            if (claimStatus) params.status = claimStatus;

            const { data } = await api.get('/admin/claims', { params });
            setHistoryClaims(data.data || []);
            setHistoryClaimsMeta(data.meta || {});
        } catch (err) {
            console.error('Error fetching claims history:', err);
        } finally {
            setClaimsLoading(false);
        }
    }, [claimSearch, claimStatus]);

    useEffect(() => {
        if (adminTab === 'claims') {
            fetchClaimsHistory(claimPage);
        }
    }, [adminTab, claimPage, fetchClaimsHistory]);

    // Fetch export preview when filters change
    useEffect(() => {
        if (adminTab !== 'export') return;

        const fetchPreview = async () => {
            try {
                setExportLoading(true);
                const params = { page: 1 };
                if (exportPeriod && exportPeriod !== 'all') params.period = exportPeriod;
                if (exportPeriod === 'custom') {
                    if (exportDateFrom) params.date_from = exportDateFrom;
                    if (exportDateTo) params.date_to = exportDateTo;
                }

                const { data } = await api.get('/admin/reports', { params });
                setExportPreview(data.data);
                setExportPreviewMeta(data.meta);
            } catch (err) {
                console.error('Error fetching export preview:', err);
            } finally {
                setExportLoading(false);
            }
        };

        const debounce = setTimeout(() => {
            fetchPreview();
        }, 300); // 300ms debounce

        return () => clearTimeout(debounce);
    }, [adminTab, exportPeriod, exportDateFrom, exportDateTo]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchReports(page);
    };

    // ── Actions ─────────────────────────────────────

    const showMessage = (msg) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(''), 3000);
    };

    const handleStatusChange = async (reportId, newStatus) => {
        try {
            await api.put(`/admin/reports/${reportId}/status`, { status: newStatus });
            showMessage(`Report #${reportId} status updated to "${newStatus}".`);
            fetchReports(currentPage);
            fetchStats();
            if (selectedReport?.id === reportId) {
                setSelectedReport(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const handleClaimAction = async (claimId, action) => {
        try {
            await api.put(`/admin/claims/${claimId}/status`, { claim_status: action });
            showMessage(`Claim #${claimId} ${action}.`);
            fetchReports(currentPage);
            fetchStats();
            if (selectedReport) {
                const updatedClaims = selectedReport.claims?.map(c =>
                    c.id === claimId ? { ...c, claim_status: action } : c
                );
                setSelectedReport(prev => ({ ...prev, claims: updatedClaims }));
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to update claim.');
        }
    };

    const handleMatchAction = async (matchId, action) => {
        try {
            await api.put(`/admin/matches/${matchId}/${action}`);
            showMessage(`Match #${matchId} ${action === 'confirm' ? 'confirmed' : 'dismissed'}.`);
            fetchMatches();
            fetchStats();
        } catch (err) {
            showMessage(err.response?.data?.message || `Failed to ${action} match.`);
        }
    };

    const handleMarkReturned = async (reportId) => {
        try {
            await api.put(`/admin/reports/${reportId}/return`);
            showMessage(`Report marked as returned.`);
            fetchReports(currentPage);
            fetchStats();
            if (selectedReport?.id === reportId) {
                setSelectedReport(prev => ({ ...prev, status: 'returned' }));
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to mark as returned.');
        }
    };

    const handleRestoreReport = async (reportId) => {
        try {
            await api.put(`/admin/reports/${reportId}/restore`);
            showMessage(`Report restored successfully.`);
            fetchReports(currentPage);
            fetchStats();
            if (selectedReport?.id === reportId) {
                setSelectedReport(prev => ({ ...prev, status: 'pending' }));
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to restore report.');
        }
    };

    const toggleProof = (id) => {
        setExpandedProofs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // ── Render ───────────────────────────────────────

    return (
        <div className="min-h-screen bg-page font-sans text-text-dark">
            <UserBar />

            <main className="container mx-auto px-4 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-wide uppercase text-text-dark mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-text-muted">
                        Welcome back, <span className="font-semibold text-text-dark">Admin</span>! Manage reports, review claims, and monitor activity.
                    </p>
                </div>

                {/* Action Message Toast */}
                {actionMessage && (
                    <div className="fixed top-20 right-6 z-50 bg-accent text-black px-6 py-3 rounded-xl text-sm font-bold shadow-2xl">
                        {actionMessage}
                    </div>
                )}

                {/* Stats Cards */}
                {statsLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-text-muted" size={32} />
                    </div>
                ) : stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatCard label="Total Reports" value={stats.reports.total} color="text-white" />
                        <StatCard label="Lost Items" value={stats.reports.by_type.lost} color="text-red-400" />
                        <StatCard label="Found Items" value={stats.reports.by_type.found} color="text-emerald-400" />
                        <StatCard label="Total Users" value={stats.users.total} color="text-white" />
                        <StatCard label="Pending Reports" value={stats.reports.by_status.pending} color="text-accent" />
                        <StatCard label="Matched" value={stats.reports.by_status.matched} color="text-blue-400" />
                        <StatCard label="Claimed" value={stats.reports.by_status.claimed} color="text-emerald-400" />
                        <StatCard label="Pending Claims" value={stats.claims.by_status.pending} color="text-accent" />
                    </div>
                )}

                {/* Tab navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['reports', 'export', 'matches', 'claims'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setAdminTab(tab)}
                            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${adminTab === tab
                                ? 'bg-accent text-black'
                                : 'bg-card text-text-muted hover:text-white border border-border'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ════════ REPORTS TAB ════════ */}
                {adminTab === 'reports' && (
                    <>
                        {/* Filters + Search */}
                        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="bg-card-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none w-full md:w-auto appearance-none cursor-pointer"
                            >
                                <option value="">All Types</option>
                                <option value="lost">Lost</option>
                                <option value="found">Found</option>
                            </select>

                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="bg-card-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none w-full md:w-auto appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="matched">Matched</option>
                                <option value="claimed">Claimed</option>
                                <option value="returned">Returned</option>
                                <option value="expired">Expired</option>
                            </select>

                            <select
                                value={filterCampus}
                                onChange={e => setFilterCampus(e.target.value)}
                                className="bg-card-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none w-full md:w-auto appearance-none cursor-pointer"
                            >
                                <option value="">All Campuses</option>
                                <option value="arlegui">Arlegui</option>
                                <option value="casal">Casal</option>
                                <option value="outside">Outside TIP</option>
                            </select>

                            <div className="relative flex-1 w-full">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search items, descriptions, locations..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-card-alt border border-border rounded-lg text-sm text-white focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Reports Table */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-text-muted" size={32} />
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="text-center py-20 text-text-muted">
                                    <FileText size={40} className="mx-auto mb-4 opacity-50" />
                                    <p className="font-semibold uppercase tracking-wider">No reports found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-card-alt text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border">
                                        <div className="col-span-1">ID</div>
                                        <div className="col-span-3">Item</div>
                                        <div className="col-span-2">Type</div>
                                        <div className="col-span-2">Status</div>
                                        <div className="col-span-2">Date</div>
                                        <div className="col-span-2 text-right">Action</div>
                                    </div>

                                    {reports.map(report => (
                                        <div
                                            key={report.id}
                                            className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 hover:bg-accent/5 transition-colors cursor-pointer items-center text-sm"
                                            onClick={() => setSelectedReport(report)}
                                        >
                                            <div className="col-span-1 text-text-muted font-mono">{report.id}</div>
                                            <div className="col-span-3 font-semibold truncate text-white flex items-center gap-2">
                                            {report.item_name}
                                            {(() => {
                                                const pendingCount = report.claims?.filter(c => c.claim_status === 'pending').length || 0;
                                                if (pendingCount > 0) {
                                                    return (
                                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                                                            {pendingCount}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                            <div className="col-span-2">
                                                <span className={`badge ${report.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                                                    {report.type}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className={`badge ${STATUS_COLORS[report.status] || ''}`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-text-muted text-xs">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="col-span-2 flex justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* Pagination */}
                            {meta.last_page > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card-alt">
                                    <span className="text-xs text-text-muted">
                                        Page {meta.current_page} of {meta.last_page} ({meta.total} reports)
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={meta.current_page <= 1}
                                            onClick={() => handlePageChange(meta.current_page - 1)}
                                            className="p-2 rounded-lg border border-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            disabled={meta.current_page >= meta.last_page}
                                            onClick={() => handlePageChange(meta.current_page + 1)}
                                            className="p-2 rounded-lg border border-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity Log */}
                        {stats?.recent_activity?.length > 0 && (
                            <div className="bg-card border border-border rounded-xl mt-6">
                                <div className="px-4 py-3 border-b border-border">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                        <Clock size={14} className="text-accent" />
                                        Recent Activity
                                    </h3>
                                </div>
                                <div className="divide-y divide-border/40">
                                    {stats.recent_activity.slice(0, 10).map((log, idx) => (
                                        <div key={log.id ?? idx} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/5 transition-colors">
                                            <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm text-gray-300 leading-snug">{log.description}</p>
                                                <p className="text-xs text-text-muted mt-1">
                                                    {typeof log.user === 'object' ? log.user?.name : log.user}
                                                    {' · '}
                                                    {new Date(log.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ════════ MATCHES TAB ════════ */}
                {adminTab === 'matches' && (
                    <div>
                        {matchesLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-text-muted" size={32} />
                            </div>
                        ) : matches.length === 0 ? (
                            <div className="bg-card border border-border rounded-xl p-12 text-center">
                                <Link2 size={40} className="mx-auto mb-4 text-text-muted opacity-50" />
                                <p className="font-bold uppercase tracking-wider text-text-muted">No pending matches</p>
                                <p className="text-text-muted text-sm mt-2">Matches will appear here when lost and found reports have similar items.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {matches.map(match => (
                                    <div key={match.id} className="bg-card border border-border rounded-xl p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Lost Report */}
                                            <div className="bg-card-alt rounded-xl p-5 border-2 border-accent/30">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="badge badge-lost">Lost</span>
                                                    <span className="text-xs text-text-muted">#{match.lost_report?.id}</span>
                                                </div>
                                                <h3 className="font-bold text-lg text-white mb-2">
                                                    {match.lost_report?.item_name}
                                                </h3>
                                                <div className="space-y-2 mb-3">
                                                    <div className="flex items-center text-text-muted text-xs">
                                                        <MapPin size={12} className="mr-1" />
                                                        {match.lost_report?.location || 'No location'}
                                                    </div>
                                                    <div className="flex items-center text-text-muted text-xs">
                                                        <Calendar size={12} className="mr-1" />
                                                        {match.lost_report?.created_at && new Date(match.lost_report.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-text-muted">
                                                        Category: <span className="text-white">{match.lost_report?.category || 'Uncategorized'}</span>
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <p className="text-xs uppercase tracking-wider font-bold text-text-muted mb-1">Description</p>
                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                        {match.lost_report?.description || 'No description provided'}
                                                    </p>
                                                </div>
                                                <div className="text-xs text-text-muted">
                                                    Reporter: <span className="text-white">{match.lost_report?.user?.name || 'Unknown'}</span>
                                                </div>
                                            </div>

                                            {/* Match Score */}
                                            <div className="lg:col-span-2 flex lg:flex-col items-center justify-center py-4 lg:py-0">
                                                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-black font-bold text-xl mb-2">
                                                    {match.similarity_score}%
                                                </div>
                                                <span className="text-xs text-text-muted uppercase tracking-wider">Match Score</span>
                                            </div>

                                            {/* Found Report */}
                                            <div className="bg-card-alt rounded-xl p-5 border-2 border-emerald-500/30">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="badge badge-found">Found</span>
                                                    <span className="text-xs text-text-muted">#{match.found_report?.id}</span>
                                                </div>
                                                <h3 className="font-bold text-lg text-white mb-2">
                                                    {match.found_report?.item_name}
                                                </h3>
                                                <div className="space-y-2 mb-3">
                                                    <div className="flex items-center text-text-muted text-xs">
                                                        <MapPin size={12} className="mr-1" />
                                                        {match.found_report?.location || 'No location'}
                                                    </div>
                                                    <div className="flex items-center text-text-muted text-xs">
                                                        <Calendar size={12} className="mr-1" />
                                                        {match.found_report?.created_at && new Date(match.found_report.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-text-muted">
                                                        Category: <span className="text-white">{match.found_report?.category || 'Uncategorized'}</span>
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <p className="text-xs uppercase tracking-wider font-bold text-text-muted mb-1">Description</p>
                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                        {match.found_report?.description || 'No description provided'}
                                                    </p>
                                                </div>
                                                <div className="text-xs text-text-muted">
                                                    Reporter: <span className="text-white">{match.found_report?.user?.name || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 mt-6 justify-end border-t border-border/30 pt-4">
                                            <button
                                                onClick={() => handleMatchAction(match.id, 'dismiss')}
                                                className="px-6 py-2 bg-card-alt border border-border rounded-lg text-xs font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors"
                                            >
                                                Dismiss Match
                                            </button>
                                            <button
                                                onClick={() => handleMatchAction(match.id, 'confirm')}
                                                className="btn-amber text-xs px-6 py-2"
                                            >
                                                Confirm Match
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ════════ EXPORT TAB ════════ */}
                {adminTab === 'export' && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-white">Export Reports</h2>
                            <p className="text-text-muted mb-6">Download reports as CSV for external analysis or record-keeping.</p>

                            {/* Period Selector */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Period</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'all', label: 'All Time' },
                                        { value: 'weekly', label: 'Last 7 Days' },
                                        { value: 'monthly', label: 'Last 30 Days' },
                                        { value: 'semestral', label: 'Last 6 Months' },
                                        { value: 'custom', label: 'Custom Range' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setExportPeriod(opt.value)}
                                            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${exportPeriod === opt.value
                                                ? 'bg-accent text-black'
                                                : 'bg-card-alt text-text-muted border border-border hover:text-white'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Date Range */}
                            {exportPeriod === 'custom' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">From</label>
                                        <input
                                            type="date"
                                            value={exportDateFrom}
                                            onChange={e => setExportDateFrom(e.target.value)}
                                            className="w-full bg-card-alt border border-border rounded-lg py-2.5 px-4 text-sm text-white focus:border-accent focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">To</label>
                                        <input
                                            type="date"
                                            value={exportDateTo}
                                            onChange={e => setExportDateTo(e.target.value)}
                                            className="w-full bg-card-alt border border-border rounded-lg py-2.5 px-4 text-sm text-white focus:border-accent focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Download Button */}
                            <button
                                onClick={async () => {
                                    setExportLoading(true);
                                    try {
                                        const params = new URLSearchParams();
                                        if (exportPeriod && exportPeriod !== 'all') params.append('period', exportPeriod);
                                        if (exportPeriod === 'custom') {
                                            if (exportDateFrom) params.append('date_from', exportDateFrom);
                                            if (exportDateTo) params.append('date_to', exportDateTo);
                                        }
                                        const token = localStorage.getItem('claimio_token');
                                        const response = await fetch(
                                            `http://localhost:8000/api/admin/reports/export?${params.toString()}`,
                                            { headers: { Authorization: `Bearer ${token}` } }
                                        );
                                        if (!response.ok) throw new Error('Export failed');
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `claimio_reports_${exportPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        window.URL.revokeObjectURL(url);
                                        showMessage('CSV exported successfully!');
                                    } catch (err) {
                                        console.error('Export error:', err);
                                        showMessage('Failed to export CSV. Please try again.');
                                    } finally {
                                        setExportLoading(false);
                                    }
                                }}
                                disabled={exportLoading || (exportPeriod === 'custom' && !exportDateFrom && !exportDateTo)}
                                className="btn-amber flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exportLoading ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <Download size={16} />
                                )}
                                {exportLoading ? 'Exporting...' : 'Download CSV'}
                            </button>

                            {/* Preview Section */}
                            <div className="mt-8 border-t border-border pt-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">
                                    Preview ({exportPreviewMeta?.total || 0} Reports)
                                </h3>

                                {exportLoading && exportPreview.length === 0 ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="animate-spin text-text-muted" size={24} />
                                    </div>
                                ) : exportPreview.length === 0 ? (
                                    <div className="text-center py-8 text-text-muted bg-card-alt rounded-xl border border-border">
                                        <p className="text-sm">No reports match the selected period.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border border-border rounded-xl">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-card-alt text-xs uppercase tracking-wider text-text-muted border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold">ID</th>
                                                    <th className="px-4 py-3 font-semibold">Item</th>
                                                    <th className="px-4 py-3 font-semibold">Type</th>
                                                    <th className="px-4 py-3 font-semibold">Status</th>
                                                    <th className="px-4 py-3 font-semibold">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {exportPreview.map(report => (
                                                    <tr key={report.id} className="hover:bg-accent/5 transition-colors">
                                                        <td className="px-4 py-3 text-text-muted font-mono">{report.id}</td>
                                                        <td className="px-4 py-3 text-white font-medium">{report.item_name}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`badge ${report.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                                                                {report.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`badge ${STATUS_COLORS[report.status] || ''}`}>
                                                                {report.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-text-muted text-xs">
                                                            {new Date(report.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {exportPreviewMeta?.total > exportPreview.length && (
                                            <div className="px-4 py-3 bg-card-alt text-xs text-text-muted text-center border-t border-border">
                                                Showing {exportPreview.length} of {exportPreviewMeta.total} reports. Download CSV to see all.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════ CLAIMS HISTORY TAB ════════ */}
                {adminTab === 'claims' && (
                    <>
                        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                            <select
                                value={claimStatus}
                                onChange={e => { setClaimStatus(e.target.value); setClaimPage(1); }}
                                className="bg-card-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none w-full md:w-auto appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            
                            <div className="relative flex-1 w-full">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search student name or email..."
                                    value={claimSearch}
                                    onChange={e => { setClaimSearch(e.target.value); setClaimPage(1); }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-card-alt border border-border rounded-lg text-sm text-white focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            {claimsLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-text-muted" size={32} />
                                </div>
                            ) : historyClaims.length === 0 ? (
                                <div className="text-center py-20 text-text-muted">
                                    <FileSearch size={40} className="mx-auto mb-4 opacity-50" />
                                    <p className="font-semibold uppercase tracking-wider">No claims found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-card-alt text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3">Claimant</th>
                                                <th className="px-4 py-3">Item</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Campus</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Proof</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {historyClaims.map(claim => (
                                                <tr key={claim.id} className="hover:bg-accent/5 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="text-white font-medium">{claim.user?.name}</div>
                                                        <div className="text-text-muted text-xs">{claim.user?.email}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-white max-w-[200px] truncate" title={claim.report?.item_name}>
                                                        {claim.report?.item_name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`badge ${claim.report?.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                                                            {claim.report?.type?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-text-muted uppercase text-xs font-bold tracking-wider">
                                                        {claim.report?.campus || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${CLAIM_COLORS[claim.claim_status] || 'bg-gray-500/20 text-gray-400'}`}>
                                                            {claim.claim_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-text-muted text-xs">
                                                        {new Date(claim.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[250px] whitespace-normal">
                                                        <div 
                                                            onClick={() => toggleProof(claim.id)}
                                                            className="cursor-pointer text-gray-300 hover:text-white transition-colors text-xs bg-card-alt p-2 rounded border border-border"
                                                        >
                                                            {expandedProofs[claim.id] ? claim.proof_description : (
                                                                claim.proof_description?.length > 40 
                                                                    ? claim.proof_description.substring(0, 40) + '...' 
                                                                    : claim.proof_description
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {historyClaimsMeta?.last_page > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card-alt">
                                    <span className="text-xs text-text-muted">
                                        Page {historyClaimsMeta.current_page} of {historyClaimsMeta.last_page} ({historyClaimsMeta.total} claims)
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={historyClaimsMeta.current_page <= 1}
                                            onClick={() => setClaimPage(prev => prev - 1)}
                                            className="p-2 rounded-lg border border-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            disabled={historyClaimsMeta.current_page >= historyClaimsMeta.last_page}
                                            onClick={() => setClaimPage(prev => prev + 1)}
                                            className="p-2 rounded-lg border border-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ════════ REPORT DETAIL MODAL ════════ */}
                {selectedReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-white uppercase tracking-wide">Report #{selectedReport.id}</h2>
                                    <span className={`badge ${selectedReport.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                                        {selectedReport.type}
                                    </span>
                                    <span className={`badge ${STATUS_COLORS[selectedReport.status] || ''}`}>
                                        {selectedReport.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="p-2 text-text-muted hover:text-white bg-card-alt rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-8 text-sm">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Item Name</p>
                                            <p className="text-white text-lg font-bold">{selectedReport.item_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Description</p>
                                            <p className="text-gray-300 leading-relaxed">{selectedReport.description}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 bg-card-alt p-5 rounded-xl border border-border">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Location</p>
                                            <p className="text-white flex items-center gap-2"><MapPin size={14} className="text-accent" /> {selectedReport.location}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Reported By</p>
                                            <div className="text-white">
                                                <p className="font-semibold">{selectedReport.user?.name}</p>
                                                <p className="text-text-muted text-xs">{selectedReport.user?.email}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Date</p>
                                            <p className="text-white flex items-center gap-2"><Calendar size={14} className="text-accent" /> {new Date(selectedReport.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Images Section */}
                                <div className="border-t border-border pt-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Images</h3>
                                    {selectedReport.images && selectedReport.images.length > 0 ? (
                                        <div className="flex gap-4 overflow-x-auto pb-4">
                                            {selectedReport.images.map(img => (
                                                <div key={img.id} className="relative shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-border">
                                                    <img
                                                        src={img.url}
                                                        alt="Report Image"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-card-alt border border-border rounded-xl p-8 text-center text-text-muted text-sm italic">
                                            No images provided for this report.
                                        </div>
                                    )}
                                </div>

                                {/* Actions - Change Status */}
                                <div className="border-t border-border pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-white">Manage Status</h3>
                                        
                                        {selectedReport.status === 'claimed' && selectedReport.claims?.some(c => c.claim_status === 'approved') && (
                                            <button
                                                onClick={() => handleMarkReturned(selectedReport.id)}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={16} />
                                                Mark as Returned
                                            </button>
                                        )}
                                        {selectedReport.status === 'expired' && (
                                            <button
                                                onClick={() => handleRestoreReport(selectedReport.id)}
                                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-gray-700/20 flex items-center gap-2"
                                            >
                                                Restore Report
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['pending', 'matched', 'claimed', 'returned'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(selectedReport.id, status)}
                                                disabled={selectedReport.status === status}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${selectedReport.status === status
                                                    ? 'bg-accent/20 border-accent/50 text-accent cursor-default'
                                                    : 'bg-card-alt border-border text-text-muted hover:text-white hover:border-gray-500'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Claims Section */}
                                <div className="border-t border-border pt-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">
                                        Claims ({selectedReport.claims?.length || 0})
                                    </h3>
                                    {!selectedReport.claims || selectedReport.claims.length === 0 ? (
                                        <p className="text-text-muted text-sm italic bg-card-alt p-4 rounded-xl border border-border text-center">No claims submitted for this report yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedReport.claims.map(claim => (
                                                <div key={claim.id} className="bg-card-alt border border-border rounded-xl p-5">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <p className="text-white font-bold">{claim.user?.name}</p>
                                                            <p className="text-text-muted text-xs">{claim.user?.email}</p>
                                                        </div>
                                                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${CLAIM_COLORS[claim.claim_status] || 'bg-gray-500/20 text-gray-400'}`}>
                                                            {claim.claim_status}
                                                        </span>
                                                    </div>
                                                    <div className="mb-4">
                                                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Proof Description</p>
                                                        <p className="text-gray-300 italic">"{claim.proof_description}"</p>
                                                    </div>

                                                    {claim.claim_status === 'pending' && (
                                                        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border/50">
                                                            <button
                                                                onClick={() => handleClaimAction(claim.id, 'rejected')}
                                                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                            <button
                                                                onClick={() => handleClaimAction(claim.id, 'approved')}
                                                                className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                                            >
                                                                Approve
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

// ── Sub-Components ──────────────────────────────────

const StatCard = ({ label, value, color }) => (
    <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-text-muted text-xs uppercase tracking-widest font-bold mb-2">{label}</h3>
        <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
    </div>
);

export default AdminDashboard;
