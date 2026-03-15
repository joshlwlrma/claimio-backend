import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserBar from '../components/UserBar';
import { Mail, Shield, User, Clock, FileText, FileSearch, Loader2, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('reports');
    const [reports, setReports] = useState([]);
    const [claims, setClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                const [reportsRes, claimsRes] = await Promise.all([
                    api.get('/user/reports'),
                    api.get('/user/claims')
                ]);
                setReports(reportsRes.data.data);
                setClaims(claimsRes.data.data);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="min-h-screen bg-landing-dark font-sans text-white">
            <UserBar />

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Profile Header Card */}
                <div className="bg-landing-surface border border-landing-border rounded-2xl p-8 mb-8 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {/* Avatar */}
                    <div className="shrink-0 relative z-10">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-32 h-32 rounded-full border-4 border-landing-dark shadow-xl object-cover" />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-black border-4 border-landing-dark shadow-xl flex items-center justify-center text-5xl font-bold text-landing-gray">
                                {userInitial}
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 p-2 bg-landing-dark rounded-full border border-landing-border shadow-lg">
                            {user?.role === 'admin' ? <Shield size={18} className="text-yellow-400" /> : <User size={18} className="text-emerald-400" />}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-grow text-center md:text-left relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                            <h1 className="text-3xl font-extrabold tracking-tight">{user?.name || 'Loading...'}</h1>
                            {user?.role === 'admin' && (
                                <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-yellow-500/30 w-max mx-auto md:mx-0">
                                    Administrator
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-center md:justify-start gap-2 text-landing-gray mb-6">
                            <Mail size={16} />
                            <span>{user?.email || 'Loading...'}</span>
                        </div>

                        <div className="flex justify-center md:justify-start gap-6">
                            <div className="text-center md:text-left">
                                <span className="block text-2xl font-bold text-white mb-1">{reports.length}</span>
                                <span className="text-xs text-landing-gray uppercase tracking-wider font-semibold">Reports</span>
                            </div>
                            <div className="w-px h-12 bg-landing-border"></div>
                            <div className="text-center md:text-left">
                                <span className="block text-2xl font-bold text-white mb-1">{claims.length}</span>
                                <span className="text-xs text-landing-gray uppercase tracking-wider font-semibold">Claims</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex mb-6 border-b border-landing-border">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${activeTab === 'reports' ? 'text-white' : 'text-landing-gray hover:text-white/80'}`}
                    >
                        <FileText size={18} />
                        My Reports
                        {activeTab === 'reports' && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('claims')}
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${activeTab === 'claims' ? 'text-white' : 'text-landing-gray hover:text-white/80'}`}
                    >
                        <FileSearch size={18} />
                        My Claims
                        {activeTab === 'claims' && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-t-full"></div>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-landing-gray">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="font-semibold uppercase tracking-wider text-sm">Loading activity...</p>
                    </div>
                ) : (
                    <div className="mt-4">
                        {activeTab === 'reports' && (
                            reports.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reports.map((report) => (
                                        <Link to={`/reports/${report.id}`} key={report.id} className="bg-landing-surface border border-landing-border rounded-xl p-6 hover:border-white/30 transition-colors group relative overflow-hidden flex flex-col h-full shadow-lg">
                                            {/* Top Status row */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${report.type === 'lost' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                    {report.type}
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white/5 text-landing-gray border-white/10">
                                                    {report.status}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <h3 className="font-bold text-lg mb-2 text-white line-clamp-1 flex-grow">{report.item_name}</h3>
                                            
                                            <div className="flex items-center text-landing-gray text-xs mt-4">
                                                <Clock size={14} className="mr-2" />
                                                <span>{new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-landing-surface border border-landing-border rounded-xl p-12 text-center">
                                    <div className="bg-black w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-landing-border">
                                        <FileText size={32} className="text-landing-gray" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 tracking-wide">No Reports Yet</h3>
                                    <p className="text-landing-gray text-sm mb-6 max-w-sm mx-auto">You haven't submitted any lost or found reports.</p>
                                    <Link to="/report" className="inline-block bg-white text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors shadow">
                                        Submit a Report
                                    </Link>
                                </div>
                            )
                        )}

                        {activeTab === 'claims' && (
                            claims.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {claims.map((claim) => (
                                        <Link to={`/reports/${claim.report_id}`} key={claim.id} className="bg-landing-surface border border-landing-border rounded-xl p-6 hover:border-white/30 transition-colors group relative overflow-hidden flex flex-col h-full shadow-lg">
                                            {/* Top Status row */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border 
                                                    ${claim.claim_status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                      claim.claim_status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                    {claim.claim_status}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-grow">
                                                <div className="text-[10px] text-landing-gray uppercase font-bold tracking-widest mb-1">Claiming Report:</div>
                                                <h3 className="font-bold text-base mb-2 text-white line-clamp-2">{claim.report?.item_name || 'Item'}</h3>
                                                <p className="text-landing-gray text-xs line-clamp-2 mb-4">
                                                    " {claim.proof_description} "
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center text-landing-gray text-xs mt-auto pt-4 border-t border-landing-border">
                                                <Clock size={14} className="mr-2" />
                                                <span>Submitted {new Date(claim.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-landing-surface border border-landing-border rounded-xl p-12 text-center">
                                    <div className="bg-black w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-landing-border">
                                        <FileSearch size={32} className="text-landing-gray" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 tracking-wide">No Claims Yet</h3>
                                    <p className="text-landing-gray text-sm mb-6 max-w-sm mx-auto">You haven't claimed any found items.</p>
                                    <Link to="/dashboard?type=found" className="inline-block bg-white text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors shadow">
                                        Browse Found Items
                                    </Link>
                                </div>
                            )
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Profile;
