import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserBar from '../components/UserBar';
import { ArrowLeft, MapPin, Calendar, AlertCircle, Loader2, Image as ImageIcon, Send, CheckCircle2, Lock, Trash2, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ReportDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

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

    // Finder report state
    const [finderMessage, setFinderMessage] = useState('');

    // Phone number modal state
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneSaving, setPhoneSaving] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // After a successful claim, check if user has phone → show modal or toast
    const handleClaimSuccess = (message) => {
        if (!user?.phone_number) {
            setClaimSuccess(message);
            setShowPhoneModal(true);
        } else {
            setClaimSuccess(message);
        }
    };

    const submitClaim = async (e) => {
        e.preventDefault();
        if (!proof.trim()) return;

        setIsClaiming(true);
        setClaimSuccess('');

        try {
            await api.post(`/reports/${id}/claims`, { proof_description: proof });
            setProof('');
            fetchReportDetails();
            handleClaimSuccess('Your claim has been submitted successfully!');
        } catch (err) {
            console.error("Claim submission failed", err);
            setClaimSuccess('Failed to submit claim. Please try again.');
        } finally {
            setIsClaiming(false);
        }
    };

    const submitFinderReport = async (e) => {
        e.preventDefault();
        if (!finderMessage.trim()) return;

        setIsClaiming(true);
        setClaimSuccess('');

        try {
            await api.post(`/reports/${id}/claims`, { 
                direction: 'finder_reporting_found',
                finder_message: finderMessage 
            });
            setFinderMessage('');
            fetchReportDetails();
            handleClaimSuccess('Thank you! The owner has been notified.');
        } catch (err) {
            console.error("Finder report submission failed", err);
            setClaimSuccess('Failed to submit report. Please try again.');
        } finally {
            setIsClaiming(false);
        }
    };

    const savePhoneNumber = async () => {
        const cleaned = phoneNumber.trim();
        if (!cleaned) return;

        // Basic PH mobile validation
        if (!/^09\d{9}$/.test(cleaned)) {
            setPhoneError('Please enter a valid PH mobile number (09xxxxxxxxx).');
            return;
        }

        setPhoneSaving(true);
        setPhoneError('');

        try {
            await api.put('/user/profile', { phone_number: cleaned });
            setUser({ ...user, phone_number: cleaned });
            setShowPhoneModal(false);
            setPhoneNumber('');
            setActionMessage('Phone number saved! You\'ll get SMS updates.');
            setTimeout(() => setActionMessage(''), 4000);
        } catch (err) {
            console.error('Failed to save phone number', err);
            setPhoneError('Failed to save. Please try again.');
        } finally {
            setPhoneSaving(false);
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

            <motion.main
                initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
                animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                transition={prefersReduced ? {} : { duration: 0.4 }}
                className="container mx-auto px-4 py-8 max-w-6xl"
            >

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
                            {isOwner && (report.status === 'pending' || report.status === 'expired') && (
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
                            <motion.div
                                initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
                                animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="bg-card rounded-2xl p-8 border border-border relative overflow-hidden"
                            >
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
                            </motion.div>
                        )}

                        {/* Finder Report Section */}
                        {canClaim && report.type === 'lost' && !report.claims?.some(c => c.user?.id === user?.id && c.direction === 'finder_reporting_found') && (
                            <motion.div 
                                initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
                                animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="bg-card rounded-2xl p-8 border border-border relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />

                                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Did you find this item?</h2>
                                <p className="text-text-muted text-sm mb-6">
                                    Let the owner know you found their item.
                                </p>

                                {claimSuccess ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-xl flex items-center font-bold tracking-wide">
                                        <CheckCircle2 className="mr-3" size={24} />
                                        {claimSuccess}
                                    </div>
                                ) : (
                                    <form onSubmit={submitFinderReport}>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                                            Where did you find it? What did you do with it?
                                        </label>
                                        <textarea
                                            required
                                            value={finderMessage}
                                            onChange={(e) => setFinderMessage(e.target.value)}
                                            rows="3"
                                            placeholder="e.g. Found near the library, surrendered to OSA Arlegui"
                                            className="input-dark mb-4 resize-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isClaiming || !finderMessage.trim()}
                                            className="flex items-center justify-center px-6 py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-colors bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed w-auto"
                                        >
                                            {isClaiming ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send className="mr-2" size={18} />}
                                            Submit Finder Report
                                        </button>
                                    </form>
                                )}
                            </motion.div>
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
                        {isOwner && claims.filter(c => c.claim_status === 'approved').length > 0 && (
                            <div className="bg-card rounded-2xl p-6 border border-border">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
                                    Claim Status
                                </h3>
                                <div className="space-y-3">
                                    {claims.filter(c => c.claim_status === 'approved').map((claim, idx) => (
                                        <div key={idx} className="bg-card-alt p-4 rounded-xl text-sm text-text-muted">
                                            <strong className="text-white block mb-1">{claim.user?.name}</strong>
                                            {claim.direction === 'finder_reporting_found' && (
                                                <div className="mt-2">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-1">Finder Message</span>
                                                    <span>{claim.finder_message}</span>
                                                </div>
                                            )}
                                            {claim.direction === 'owner_claiming_found' && (
                                                <div className="mt-2">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-1">Proof Description</span>
                                                    <span>{claim.proof_description}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </motion.main>

            {/* ─── Phone Number Modal ─── */}
            <AnimatePresence>
                {showPhoneModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    >
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowPhoneModal(false)}
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={prefersReduced ? {} : { opacity: 0, scale: 0.9, y: 20 }}
                            animate={prefersReduced ? {} : { opacity: 1, scale: 1, y: 0 }}
                            exit={prefersReduced ? {} : { opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                            className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
                        >
                            {/* Accent bar */}
                            <div className="h-1 bg-accent w-full" />

                            <div className="p-8">
                                {/* Close button */}
                                <button
                                    onClick={() => setShowPhoneModal(false)}
                                    className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                {/* Icon */}
                                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-5">
                                    <Phone size={24} className="text-accent" />
                                </div>

                                <h3 className="text-xl font-bold text-white uppercase tracking-wide mb-2">
                                    Claim Submitted!
                                </h3>
                                <p className="text-xl font-bold text-white uppercase tracking-wide mb-1">
                                    Want SMS Updates?
                                </p>
                                <p className="text-sm text-text-muted mb-6 leading-relaxed">
                                    Enter your mobile number to get text alerts when your claim status changes.
                                </p>

                                {/* Phone Input */}
                                <div className="relative mb-2">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            setPhoneNumber(e.target.value);
                                            setPhoneError('');
                                        }}
                                        placeholder="09xxxxxxxxx"
                                        maxLength={11}
                                        className="input-dark pl-11 w-full"
                                    />
                                </div>

                                {/* Error */}
                                {phoneError && (
                                    <p className="text-red-400 text-xs mb-3 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {phoneError}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col gap-3 mt-5">
                                    <button
                                        onClick={savePhoneNumber}
                                        disabled={phoneSaving || !phoneNumber.trim()}
                                        className="btn-amber w-full py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {phoneSaving ? (
                                            <Loader2 className="animate-spin mr-2" size={18} />
                                        ) : (
                                            <CheckCircle2 className="mr-2" size={18} />
                                        )}
                                        Save & Close
                                    </button>
                                    <button
                                        onClick={() => setShowPhoneModal(false)}
                                        className="text-sm text-text-muted hover:text-white transition-colors py-2 font-medium"
                                    >
                                        No Thanks
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReportDetail;
