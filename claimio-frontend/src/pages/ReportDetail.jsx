import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserBar from '../components/UserBar';
import { ArrowLeft, MapPin, Calendar, AlertCircle, Loader2, Image as ImageIcon, Send, CheckCircle2, Lock, Trash2 } from 'lucide-react';

const ReportDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [report, setReport] = useState(null);
    const [claims, setClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Claim submission state
    const [proof, setProof] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimSuccess, setClaimSuccess] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        fetchReportDetails();
    }, [id]);

    const fetchReportDetails = async () => {
        try {
            setIsLoading(true);
            setError('');

            const result = await api.get(`/reports/${id}`);
            setReport(result.data.data);

            try {
                const claimsResult = await api.get(`/reports/${id}/claims`);
                setClaims(claimsResult.data.data || []);
            } catch (e) {
                console.log("Could not fetch claims.");
            }

        } catch (err) {
            console.error(err);
            setError('Could not load report details. It may have been deleted or you lack permission.');
        } finally {
            setIsLoading(false);
        }
    };

    const submitClaim = async (e) => {
        e.preventDefault();
        if (!proof.trim()) return;

        setIsClaiming(true);
        setClaimSuccess('');

        try {
            await api.post(`/reports/${id}/claims`, { proof_description: proof });
            setClaimSuccess('Your claim has been submitted successfully!');
            setProof('');
            fetchReportDetails();
        } catch (err) {
            console.error("Claim submission failed", err);
            setClaimSuccess('Failed to submit claim. Please try again.');
        } finally {
            setIsClaiming(false);
        }
    };

    // UI Helpers
    const isAdmin = user && user.role === 'admin';
    const isOwner = user && report && user.id === report.user?.id;
    const hasFullAccess = isOwner || isAdmin;
    const canClaim = user && !isOwner && report?.status !== 'claimed' && report?.status !== 'returned';

    const formattedDate = report?.created_at
        ? new Date(report.created_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : 'Unknown Date';

    const statusBadgeClass = {
        pending: 'badge-pending',
        matched: 'badge-matched',
        claimed: 'badge-claimed',
        returned: 'badge-returned',
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-page flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-accent mb-4" size={48} />
                <p className="font-bold uppercase tracking-widest text-text-muted">Loading Details...</p>
            </div>
        );
    }

    if (error && !report) {
        return (
            <div className="min-h-screen bg-page font-sans">
                <UserBar />
                <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
                    <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-text-dark mb-2">Error</h2>
                    <p className="text-text-muted mb-8">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-amber">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page font-sans pb-12">
            <UserBar />

            <main className="container mx-auto px-4 py-8 max-w-6xl">

                {/* Back Link */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-text-muted hover:text-text-dark transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Go Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* Action Message Toast */}
                    {actionMessage && (
                        <div className="fixed top-20 right-6 z-50 bg-accent text-black px-6 py-3 rounded-xl text-sm font-bold shadow-2xl">
                            {actionMessage}
                        </div>
                    )}
                    {actionError && (
                        <div className="fixed top-20 right-6 z-50 bg-red-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-2xl">
                            {actionError}
                        </div>
                    )}

                    {/* LEFT Column — Details (dark card) */}
                    <div className="lg:col-span-3 space-y-6">

                        <div className="bg-card rounded-2xl p-8 border border-border">
                            {/* Badges */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`badge ${report.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                                    {report.type} Item
                                </span>
                                <span className={`badge ${statusBadgeClass[report.status] || 'badge-pending'}`}>
                                    Status: {report.status}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 uppercase tracking-wide">
                                {report.item_name}
                            </h1>

                            {/* Info row */}
                            <div className="flex flex-wrap gap-6 mb-6">
                                {report.location && (
                                    <div className="flex items-center text-text-muted text-sm">
                                        <MapPin size={16} className="mr-2 text-accent" />
                                        <span>{report.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center text-text-muted text-sm">
                                    <Calendar size={16} className="mr-2 text-accent" />
                                    <span>{formattedDate}</span>
                                </div>
                            </div>

                            {/* Description / Name on Item */}
                            {report.is_sensitive && !hasFullAccess ? (
                                <div className="border-t border-border pt-6 mt-6">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Name on item</h2>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                                        {report.name_on_item}
                                    </p>
                                </div>
                            ) : report.description && (
                                <div className="border-t border-border pt-6 mt-6">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Description</h2>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {report.description}
                                    </p>
                                    {report.is_sensitive && report.name_on_item && (
                                        <div className="mt-4">
                                            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Name on item</h2>
                                            <p className="text-accent font-medium">{report.name_on_item}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Owner Delete Button */}
                            {isOwner && (
                                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                                    <button 
                                        onClick={async () => {
                                            if (window.confirm("Are you sure you want to delete this report? This cannot be undone.")) {
                                                try {
                                                    await api.delete(`/reports/${report.id}`);
                                                    setActionMessage('Report deleted successfully');
                                                    setTimeout(() => navigate('/dashboard'), 1500);
                                                } catch (err) {
                                                    console.error(err);
                                                    setActionError('Failed to delete report.');
                                                    setTimeout(() => setActionError(''), 3000);
                                                }
                                            }
                                        }}
                                        className="text-xs font-bold uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-colors flex items-center"
                                    >
                                        <Trash2 size={16} className="mr-2" />
                                        Delete Report
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Claim Section */}
                        {canClaim && report.type === 'found' && (
                            <div className="bg-card rounded-2xl p-8 border border-border relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-accent" />

                                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Is this yours?</h2>
                                <p className="text-text-muted text-sm mb-6">
                                    Provide a description, serial number, or evidence to claim this item.
                                </p>

                                {claimSuccess ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-xl flex items-center font-bold tracking-wide">
                                        <CheckCircle2 className="mr-3" size={24} />
                                        {claimSuccess}
                                    </div>
                                ) : (
                                    <form onSubmit={submitClaim}>
                                        <textarea
                                            required
                                            value={proof}
                                            onChange={(e) => setProof(e.target.value)}
                                            rows="3"
                                            placeholder="e.g. My initials are scratched into the bottom..."
                                            className="input-dark mb-4 resize-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isClaiming || !proof.trim()}
                                            className="btn-amber flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isClaiming ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send className="mr-2" size={18} />}
                                            Submit Claim
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Login prompt */}
                        {!user && (
                            <div className="bg-card rounded-2xl p-6 border border-border flex items-center justify-between">
                                <p className="text-sm text-text-muted">Log in to claim this item or contact the reporter.</p>
                                <button onClick={() => navigate('/login')} className="btn-amber text-xs">
                                    Log In
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT Column — Images (dark card) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card rounded-2xl p-6 border border-border">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center">
                                <ImageIcon size={16} className="mr-2" /> Image
                            </h3>

                            {report.images && report.images.length > 0 ? (
                                <div className="space-y-3">
                                    {report.images.map((img, i) => (
                                        <div key={i} className="rounded-xl overflow-hidden border border-border relative">
                                            <img
                                                src={img.url}
                                                alt="Report item"
                                                className={`w-full h-auto object-cover ${report.is_sensitive && !hasFullAccess ? 'blur-md brightness-75 select-none' : ''}`}
                                                draggable={report.is_sensitive && !hasFullAccess ? 'false' : 'true'}
                                                onError={(e) => {
                                                    e.target.src = '';
                                                    e.target.parentElement.innerHTML = '<div class="w-full h-48 flex items-center justify-center text-xs text-text-muted bg-card-alt">Failed to load</div>';
                                                }}
                                            />
                                            {report.is_sensitive && !hasFullAccess && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10 pointer-events-none">
                                                    <div className="bg-black/70 p-4 rounded-full mb-3 backdrop-blur-md">
                                                        <Lock size={24} className="text-accent" />
                                                    </div>
                                                    <span className="text-sm font-bold text-white bg-black/70 px-4 py-2 rounded-lg backdrop-blur-md shadow-lg">
                                                        Submit a claim to view full details
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center">
                                    <ImageIcon className="text-text-muted/30 mb-2" size={40} />
                                    <p className="text-xs text-text-muted">No images provided for this report.</p>
                                </div>
                            )}
                        </div>

                        {/* Claims list (owner only) */}
                        {isOwner && claims.length > 0 && (
                            <div className="bg-card rounded-2xl p-6 border border-border">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
                                    Pending Claims ({claims.length})
                                </h3>
                                <div className="space-y-3">
                                    {claims.map((claim, idx) => (
                                        <div key={idx} className="bg-card-alt p-4 rounded-xl text-sm text-text-muted">
                                            <strong className="text-white block mb-1">Claimant #{claim.user_id}</strong>
                                            {claim.proof_description}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default ReportDetail;
