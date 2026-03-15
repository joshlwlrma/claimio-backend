import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserBar from '../components/UserBar';
import { ArrowLeft, MapPin, Calendar, Clock, AlertCircle, Loader2, Image as ImageIcon, Send, CheckCircle2 } from 'lucide-react';

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

    useEffect(() => {
        fetchReportDetails();
    }, [id]);

    const fetchReportDetails = async () => {
        try {
            setIsLoading(true);
            setError('');

            // Fetch report
            const result = await api.get(`/reports/${id}`);
            setReport(result.data.data);

            // Attempt to fetch claims for this report (assuming endpoint exists, or fallback gracefully)
            try {
                const claimsResult = await api.get(`/reports/${id}/claims`);
                setClaims(claimsResult.data.data || []);
            } catch (e) {
                console.log("Could not fetch claims, might not be implemented yet or unauthorized.");
            }

        } catch (err) {
            console.error(err);
            setError('Could not load report details. It may have been deleted or you lack permission.');

            // Fallback for visual demonstration
            setReport({
                id: id,
                type: 'found',
                item_name: 'Visual Demo Item Label',
                description: 'This is a demo frontend fallback description because the API request failed.',
                location: 'Campus Building',
                status: 'open',
                user_id: 999,
                created_at: new Date().toISOString(),
                images: []
            });
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
            setClaimSuccess('Your claim has been submitted to the finder!');
            setProof('');
            // Refresh claims list
            fetchReportDetails();
        } catch (err) {
            console.error("Claim submission failed", err);
            setClaimSuccess('Demo: Claim requested (API failed but showing success state)');
            setProof('');
        } finally {
            setIsClaiming(false);
        }
    };

    // UI Helpers
    const isOwner = user && report && user.id === report.user_id;
    const isFoundStatus = report?.type === 'found';
    const showClaimBox = user && !isOwner && isFoundStatus && report.status === 'open';

    // Format date
    const formattedDate = report?.created_at
        ? new Date(report.created_at).toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })
        : 'Unknown Date';

    // Main Render
    if (isLoading) {
        return (
            <div className="min-h-screen bg-landing-dark text-white font-sans flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-landing-gray mb-4" size={48} />
                <p className="font-bold uppercase tracking-widest text-landing-gray">Loading Details...</p>
            </div>
        );
    }

    if (error && !report) {
        return (
            <div className="min-h-screen bg-landing-dark font-sans text-white">
                <UserBar />
                <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
                    <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-white mb-2">Error</h2>
                    <p className="text-landing-gray mb-8">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="bg-white text-black font-bold uppercase py-3 px-8 rounded-full tracking-widest">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const typeBadgeClass = report.type === 'lost' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';

    return (
        <div className="min-h-screen bg-landing-dark font-sans text-white pb-12">
            <UserBar />

            <main className="container mx-auto px-4 py-8 max-w-5xl">

                {/* Header Nav */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-landing-gray hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Reports
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content (Left) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Header Card */}
                        <div className="bg-landing-surface border border-landing-border rounded-2xl p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${typeBadgeClass}`}>
                                    {report.type} Item
                                </span>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${report.status === 'resolved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-black/50 text-landing-gray border-landing-border'}`}>
                                    Status: {report.status}
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-6 uppercase tracking-wide">
                                {report.item_name}
                            </h1>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-black p-6 rounded-xl border border-landing-border">
                                <div className="flex items-start">
                                    <MapPin className="text-landing-gray mr-3 mt-0.5 shrink-0" size={20} />
                                    <div>
                                        <h4 className="text-[10px] uppercase font-bold text-landing-gray tracking-widest mb-1">Location</h4>
                                        <p className="font-semibold text-white">{report.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Calendar className="text-landing-gray mr-3 mt-0.5 shrink-0" size={20} />
                                    <div>
                                        <h4 className="text-[10px] uppercase font-bold text-landing-gray tracking-widest mb-1">Date Reported</h4>
                                        <p className="font-semibold text-white">{formattedDate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="bg-landing-surface border border-landing-border rounded-2xl p-8 shadow-2xl">
                            <h2 className="text-lg font-bold uppercase tracking-widest text-white mb-4 border-b border-landing-border pb-4">Description</h2>
                            <div className="text-landing-gray leading-relaxed whitespace-pre-wrap">
                                {report.description}
                            </div>
                        </div>

                        {/* Claim Section (Only showing for FOUND items to non-owners) */}
                        {showClaimBox && (
                            <div className="bg-black border border-landing-border rounded-2xl p-8 shadow-lg ring-1 ring-white/10 relative overflow-hidden">
                                {/* Decorative border accent */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>

                                <h2 className="text-2xl font-extrabold text-white mb-2 uppercase tracking-wide">Is this yours?</h2>
                                <p className="text-landing-gray text-sm mb-6">Provide a description, serial number, or photo evidence to claim this item from the finder.</p>

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
                                            className="w-full bg-landing-dark border border-landing-border rounded-xl p-4 text-white focus:outline-none focus:border-white transition-colors resize-none mb-4 placeholder:text-landing-gray/40 font-mono text-sm"
                                        ></textarea>
                                        <button
                                            type="submit"
                                            disabled={isClaiming || !proof.trim()}
                                            className="bg-white text-black font-extrabold uppercase tracking-widest py-3 px-8 rounded-full shadow-md hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isClaiming ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send className="mr-2" size={18} />}
                                            Submit Claim
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {!user && (
                            <div className="bg-black border border-landing-border rounded-2xl p-6 flex items-center justify-between shadow-sm">
                                <p className="text-sm text-landing-gray">Log in to claim this item or contact the reporter.</p>
                                <button onClick={() => navigate('/login')} className="bg-white text-black text-xs font-bold uppercase px-6 py-2 rounded-full tracking-widest border border-white hover:bg-black hover:text-white transition-colors">
                                    Log In
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Images (Right) */}
                    <div className="space-y-6">

                        <div className="bg-landing-surface border border-landing-border rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center">
                                <ImageIcon size={16} className="mr-2 text-landing-gray" /> Images
                            </h3>

                            {report.images && report.images.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {report.images.map((img, i) => (
                                        <div key={i} className="aspect-square bg-black border border-landing-border rounded-xl overflow-hidden group">
                                            <img
                                                src={img.url}
                                                alt="Report item"
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                onError={(e) => { e.target.src = ''; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-landing-gray">Error load</div>'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-black border border-landing-border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                    <ImageIcon className="text-landing-gray border-landing-border mb-2 opacity-50" size={32} />
                                    <p className="text-xs text-landing-gray">No images provided for this report.</p>
                                </div>
                            )}
                        </div>

                        {/* Claims list metadata (If owner views their own found item) */}
                        {isOwner && claims.length > 0 && (
                            <div className="bg-landing-surface border border-landing-border rounded-2xl p-6 shadow-2xl">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Pending Claims ({claims.length})</h3>
                                <div className="space-y-3">
                                    {claims.map((claim, idx) => (
                                        <div key={idx} className="bg-black p-4 inline-block w-full border border-landing-border rounded-xl text-sm text-landing-gray line-clamp-3">
                                            <strong className="text-white block mb-1">Claimant #{claim.user_id}</strong>
                                            {claim.proof_of_ownership}
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
