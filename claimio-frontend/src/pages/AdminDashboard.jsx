import React, { useState, useEffect, useCallback } from 'react';
import UserBar from '../components/UserBar';
import api from '../services/api';
import {
    BarChart3, Users, FileText, AlertTriangle, CheckCircle2, XCircle,
    Download, Search, ChevronLeft, ChevronRight, Loader2, Eye,
    ArrowUpDown, Clock, Shield
} from 'lucide-react';

const STATUS_COLORS = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    matched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    claimed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    returned: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const CLAIM_COLORS = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
};

const AdminDashboard = () => {
    // ── State ───────────────────────────────────────
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [meta, setMeta] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    // Filters
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Detail panel
    const [selectedReport, setSelectedReport] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Action feedback
    const [actionMessage, setActionMessage] = useState('');

    // ── Data Fetching ───────────────────────────────

    const fetchStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const { data } = await api.get('/admin/stats');
            // Map backend flat response to the shape the UI expects
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
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const { data } = await api.get('/admin/reports', { params });
            setReports(data.data);
            setMeta(data.meta);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filterType, filterStatus, searchQuery]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        setCurrentPage(1);
        fetchReports(1);
    }, [fetchReports]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchReports(page);
    };

    // ── Actions ─────────────────────────────────────

    const showMessage = (msg) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(''), 3000);
    };

    const handleViewReport = async (reportId) => {
        try {
            setDetailLoading(true);
            setSelectedReport(null);
            const { data } = await api.get(`/admin/reports`, { params: { page: 1 } });
            const report = data.data.find(r => r.id === reportId);
            if (report) {
                setSelectedReport(report);
            } else {
                // Fallback: find in already loaded reports
                setSelectedReport(reports.find(r => r.id === reportId));
            }
        } catch (err) {
            console.error('Error loading report:', err);
        } finally {
            setDetailLoading(false);
        }
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
            await api.put(`/claims/${claimId}/status`, { claim_status: action });
            showMessage(`Claim #${claimId} ${action}.`);
            fetchReports(currentPage);
            fetchStats();
            // Refresh detail panel
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

    const handleExport = async () => {
        try {
            const params = {};
            if (filterType) params.type = filterType;
            if (filterStatus) params.status = filterStatus;

            const response = await api.get('/admin/reports/export', {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `claimio_reports_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showMessage('CSV export downloaded.');
        } catch (err) {
            showMessage('Export failed.');
        }
    };

    // ── Render ───────────────────────────────────────

    return (
        <div className="min-h-screen bg-landing-dark font-sans text-white">
            <UserBar />

            <main className="container mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Shield size={24} className="text-yellow-400" />
                            <h1 className="text-3xl font-extrabold tracking-wide uppercase">Admin Dashboard</h1>
                        </div>
                        <p className="text-landing-gray">Manage reports, review claims, and monitor activity.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>

                {/* Action Message Toast */}
                {actionMessage && (
                    <div className="fixed top-20 right-6 z-50 bg-emerald-500/90 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-pulse">
                        {actionMessage}
                    </div>
                )}

                {/* Stats Cards */}
                {statsLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-landing-gray" size={32} />
                    </div>
                ) : stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatCard icon={<FileText size={20} />} label="Total Reports" value={stats.reports.total} color="text-white" />
                        <StatCard icon={<AlertTriangle size={20} />} label="Lost Items" value={stats.reports.by_type.lost} color="text-red-400" />
                        <StatCard icon={<CheckCircle2 size={20} />} label="Found Items" value={stats.reports.by_type.found} color="text-emerald-400" />
                        <StatCard icon={<Users size={20} />} label="Total Users" value={stats.users.total} color="text-blue-400" />

                        <StatCard icon={<Clock size={20} />} label="Pending Reports" value={stats.reports.by_status.pending} color="text-yellow-400" />
                        <StatCard icon={<BarChart3 size={20} />} label="Matched" value={stats.reports.by_status.matched} color="text-blue-400" />
                        <StatCard icon={<CheckCircle2 size={20} />} label="Claimed" value={stats.reports.by_status.claimed} color="text-emerald-400" />
                        <StatCard icon={<Clock size={20} />} label="Pending Claims" value={stats.claims.by_status.pending} color="text-yellow-400" />
                    </div>
                )}

                {/* Filters + Search */}
                <div className="bg-landing-surface border border-landing-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="bg-black border border-landing-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none w-full md:w-auto"
                    >
                        <option value="">All Types</option>
                        <option value="lost">Lost</option>
                        <option value="found">Found</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="bg-black border border-landing-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none w-full md:w-auto"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="matched">Matched</option>
                        <option value="claimed">Claimed</option>
                        <option value="returned">Returned</option>
                    </select>

                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-landing-gray" />
                        <input
                            type="text"
                            placeholder="Search items, descriptions, locations..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-black border border-landing-border rounded-lg text-sm text-white focus:border-white focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Main Content: Table + Detail Panel */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Reports Table */}
                    <div className={`flex-1 ${selectedReport ? 'lg:w-3/5' : 'w-full'}`}>
                        <div className="bg-landing-surface border border-landing-border rounded-xl overflow-hidden shadow-2xl">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-landing-gray" size={32} />
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="text-center py-20 text-landing-gray">
                                    <FileText size={40} className="mx-auto mb-4 opacity-50" />
                                    <p className="font-semibold uppercase tracking-wider">No reports found</p>
                                </div>
                            ) : (
                                <>
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-black/50 text-xs font-bold uppercase tracking-wider text-landing-gray border-b border-landing-border">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-3">Item</div>
                                        <div className="col-span-2">Type</div>
                                        <div className="col-span-2">Status</div>
                                        <div className="col-span-2">Date</div>
                                        <div className="col-span-2 text-right">Actions</div>
                                    </div>

                                    {/* Table Rows */}
                                    {reports.map(report => (
                                        <div
                                            key={report.id}
                                            className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-landing-border/50 hover:bg-white/5 transition-colors cursor-pointer items-center text-sm ${selectedReport?.id === report.id ? 'bg-white/10' : ''}`}
                                            onClick={() => { setSelectedReport(report); }}
                                        >
                                            <div className="col-span-1 text-landing-gray font-mono">{report.id}</div>
                                            <div className="col-span-3 font-semibold truncate">{report.item_name}</div>
                                            <div className="col-span-2">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${report.type === 'lost' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                    {report.type}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${STATUS_COLORS[report.status] || ''}`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-landing-gray text-xs">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="col-span-2 flex justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-landing-gray hover:text-white"
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
                                <div className="flex items-center justify-between px-4 py-3 border-t border-landing-border bg-black/30">
                                    <span className="text-xs text-landing-gray">
                                        Page {meta.current_page} of {meta.last_page} ({meta.total} reports)
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={meta.current_page <= 1}
                                            onClick={() => handlePageChange(meta.current_page - 1)}
                                            className="p-2 rounded-lg border border-landing-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            disabled={meta.current_page >= meta.last_page}
                                            onClick={() => handlePageChange(meta.current_page + 1)}
                                            className="p-2 rounded-lg border border-landing-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detail Panel (slides in when a report is selected) */}
                    {selectedReport && (
                        <div className="lg:w-2/5 bg-landing-surface border border-landing-border rounded-xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                            {/* Close button */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedReport.item_name}</h2>
                                    <p className="text-landing-gray text-xs mt-1">Report #{selectedReport.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="text-landing-gray hover:text-white transition-colors text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Type + Status badges */}
                            <div className="flex gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedReport.type === 'lost' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {selectedReport.type}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${STATUS_COLORS[selectedReport.status] || ''}`}>
                                    {selectedReport.status}
                                </span>
                            </div>

                            {/* Info fields */}
                            <div className="space-y-3 mb-6">
                                <DetailField label="Description" value={selectedReport.description} />
                                <DetailField label="Location" value={selectedReport.location} />
                                <DetailField label="Category" value={selectedReport.category} />
                                <DetailField label="Date" value={selectedReport.date_occurrence} />
                                <DetailField label="Contact" value={selectedReport.contact_number} />
                                <DetailField label="Reporter" value={`${selectedReport.user?.name} (${selectedReport.user?.email})`} />
                                <DetailField label="Submitted" value={new Date(selectedReport.created_at).toLocaleString()} />
                            </div>

                            {/* Images */}
                            {selectedReport.images?.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xs uppercase tracking-wider font-bold text-landing-gray mb-2">Attached Images</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedReport.images.map(img => (
                                            <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={img.url}
                                                    alt="Report attachment"
                                                    className="w-full h-24 object-cover rounded-lg border border-landing-border hover:border-white transition-colors"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status Change */}
                            <div className="mb-6">
                                <h3 className="text-xs uppercase tracking-wider font-bold text-landing-gray mb-2">Change Status</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['pending', 'matched', 'claimed', 'returned'].map(s => (
                                        <button
                                            key={s}
                                            disabled={selectedReport.status === s}
                                            onClick={() => handleStatusChange(selectedReport.id, s)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-colors ${selectedReport.status === s
                                                    ? 'border-white/30 bg-white/10 text-white cursor-default'
                                                    : `${STATUS_COLORS[s]} hover:opacity-80 cursor-pointer`
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Claims Review */}
                            {selectedReport.claims?.length > 0 && (
                                <div>
                                    <h3 className="text-xs uppercase tracking-wider font-bold text-landing-gray mb-3">
                                        Claims ({selectedReport.claims.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedReport.claims.map(claim => (
                                            <div key={claim.id} className="bg-black/40 border border-landing-border rounded-xl p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-semibold">{claim.user?.name}</p>
                                                        <p className="text-xs text-landing-gray">{claim.user?.email}</p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${CLAIM_COLORS[claim.claim_status] || ''}`}>
                                                        {claim.claim_status}
                                                    </span>
                                                </div>

                                                {/* Proof description — admin sees this */}
                                                {claim.proof_description && (
                                                    <div className="bg-black/60 rounded-lg p-3 mb-3">
                                                        <p className="text-xs uppercase tracking-wider font-bold text-landing-gray mb-1">Proof Description</p>
                                                        <p className="text-sm text-gray-300">{claim.proof_description}</p>
                                                    </div>
                                                )}

                                                {/* Action buttons (only for pending claims) */}
                                                {claim.claim_status === 'pending' && (
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleClaimAction(claim.id, 'approved')}
                                                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                                        >
                                                            <CheckCircle2 size={14} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleClaimAction(claim.id, 'rejected')}
                                                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                                        >
                                                            <XCircle size={14} /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!selectedReport.claims || selectedReport.claims.length === 0) && (
                                <div className="text-center py-4 text-landing-gray">
                                    <p className="text-xs uppercase tracking-wider font-bold">No claims filed yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                {stats?.recent_activity?.length > 0 && (
                    <div className="mt-8 bg-landing-surface border border-landing-border rounded-xl p-6 shadow-2xl">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-landing-gray mb-4 flex items-center gap-2">
                            <Clock size={16} /> Recent Activity
                        </h2>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {stats.recent_activity.map(log => (
                                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-landing-border/30 last:border-0">
                                    <div className="w-2 h-2 rounded-full bg-landing-gray mt-1.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{log.description}</p>
                                        <p className="text-xs text-landing-gray">
                                            {log.user?.name} • {new Date(log.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

// ── Sub-Components ──────────────────────────────────

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-landing-surface border border-landing-border rounded-xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
            <span className={`${color} opacity-70`}>{icon}</span>
            <h3 className="text-landing-gray text-xs uppercase tracking-widest font-bold">{label}</h3>
        </div>
        <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
    </div>
);

const DetailField = ({ label, value }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs uppercase tracking-wider font-bold text-landing-gray mb-0.5">{label}</p>
            <p className="text-sm text-gray-300">{value}</p>
        </div>
    );
};

export default AdminDashboard;
