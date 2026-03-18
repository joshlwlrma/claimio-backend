import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserBar from '../components/UserBar';
import { Mail, Shield, User, Clock, FileText, FileSearch, Loader2, Phone, Save, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('reports');
    const [reports, setReports] = useState([]);
    const [claims, setClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Phone number state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneSaving, setPhoneSaving] = useState(false);
    const [phoneMessage, setPhoneMessage] = useState('');

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
            setPhoneNumber(user.phone_number || '');
        }
    }, [user]);

    const handleSavePhone = async () => {
        setPhoneSaving(true);
        setPhoneMessage('');
        try {
            await api.put('/user/profile', { phone_number: phoneNumber });
            setPhoneMessage('Phone number saved!');
            setTimeout(() => setPhoneMessage(''), 3000);
        } catch (err) {
            setPhoneMessage('Failed to save phone number.');
        } finally {
            setPhoneSaving(false);
        }
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    const statusBadgeClass = (status) => {
        const map = {
            pending: 'badge-pending',
            matched: 'badge-matched',
            claimed: 'badge-claimed',
            returned: 'badge-returned',
            approved: 'bg-emerald-500 text-white',
            rejected: 'bg-red-500 text-white',
        };
        return map[status] || 'bg-gray-500 text-white';
    };

    return (
        <div className="min-h-screen bg-page font-sans">
            <UserBar />

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Profile Header Card — Dark */}
                <div className="bg-card rounded-2xl p-8 mb-8 border border-border flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="mb-4">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-28 h-28 rounded-full border-4 border-dark object-cover" />
                        ) : (
                            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center text-4xl font-bold text-card">
                                {userInitial}
                            </div>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
                            {user?.name || 'Loading...'}
                        </h1>
                        {user?.role === 'admin' && (
                            <span className="badge badge-pending">
                                <Shield size={10} className="mr-1" /> Admin
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-text-muted mb-6">
                        <Mail size={14} />
                        <span className="text-sm">{user?.email || 'Loading...'}</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-8">
                        <div>
                            <span className="block text-2xl font-bold text-white">{reports.length}</span>
                            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Reports</span>
                        </div>
                        <div className="w-px h-12 bg-border" />
                        <div>
                            <span className="block text-2xl font-bold text-white">{claims.length}</span>
                            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Claims</span>
                        </div>
                    </div>
                </div>

                {/* Phone Number Card */}
                <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Phone size={16} className="text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-dark">Phone Number (Optional)</h3>
                    </div>
                    <p className="text-xs text-text-muted mb-4">
                        Used only for SMS notifications when your claims are approved/rejected. Never shared publicly.
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="09XX XXX XXXX"
                            className="flex-1 bg-page border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-text-dark focus:outline-none focus:border-accent transition-colors"
                        />
                        <button
                            onClick={handleSavePhone}
                            disabled={phoneSaving}
                            className="btn-amber text-xs px-5 py-2 flex items-center gap-2"
                        >
                            {phoneSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            Save
                        </button>
                    </div>
                    {phoneMessage && (
                        <p className={`mt-3 text-xs font-semibold flex items-center gap-1 ${phoneMessage.includes('Failed') ? 'text-red-500' : 'text-emerald-500'}`}>
                            <CheckCircle2 size={12} /> {phoneMessage}
                        </p>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
                            activeTab === 'reports' ? 'text-text-dark' : 'text-text-muted hover:text-text-dark'
                        }`}
                    >
                        <FileText size={18} />
                        My Reports
                        {activeTab === 'reports' && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('claims')}
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
                            activeTab === 'claims' ? 'text-text-dark' : 'text-text-muted hover:text-text-dark'
                        }`}
                    >
                        <FileSearch size={18} />
                        My Claims
                        {activeTab === 'claims' && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="font-semibold uppercase tracking-wider text-sm">Loading activity...</p>
                    </div>
                ) : (
                    <div className="mt-4">
                        {activeTab === 'reports' && (
                            reports.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reports.map((report) => (
                                        <Link to={`/reports/${report.id}`} key={report.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow group flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`badge ${report.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                                                    {report.type}
                                                </span>
                                                <span className={`badge ${statusBadgeClass(report.status)}`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg mb-2 text-text-dark line-clamp-1 flex-grow">{report.item_name}</h3>
                                            <div className="flex items-center text-text-muted text-xs mt-4">
                                                <Clock size={14} className="mr-2" />
                                                <span>{new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                                    <div className="bg-page w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FileText size={32} className="text-text-muted" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-dark mb-2 tracking-wide">No Reports Yet</h3>
                                    <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">You haven't submitted any lost or found reports.</p>
                                    <Link to="/report" className="btn-amber">
                                        Submit a Report
                                    </Link>
                                </div>
                            )
                        )}

                        {activeTab === 'claims' && (
                            claims.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {claims.map((claim) => (
                                        <Link to={`/reports/${claim.report_id}`} key={claim.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow group flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`badge ${statusBadgeClass(claim.claim_status)}`}>
                                                    {claim.claim_status}
                                                </span>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Claiming Report:</div>
                                                <h3 className="font-bold text-base mb-2 text-text-dark line-clamp-2">
                                                    {claim.report?.item_name || 'Item'}
                                                </h3>
                                                <p className="text-text-muted text-xs line-clamp-2 mb-4">
                                                    "{claim.proof_description}"
                                                </p>
                                            </div>
                                            <div className="flex items-center text-text-muted text-xs mt-auto pt-4 border-t border-gray-100">
                                                <Clock size={14} className="mr-2" />
                                                <span>Submitted {new Date(claim.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                                    <div className="bg-page w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FileSearch size={32} className="text-text-muted" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-dark mb-2 tracking-wide">No Claims Yet</h3>
                                    <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">You haven't claimed any found items.</p>
                                    <Link to="/dashboard?type=found" className="btn-amber">
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
