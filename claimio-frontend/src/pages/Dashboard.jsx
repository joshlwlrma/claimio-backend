import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UserBar from '../components/UserBar';
import ReportCard from '../components/ReportCard';
import api from '../services/api';
import { Search, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const Dashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Parse URL parameters
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('type') || 'all';
    const initialPage = parseInt(queryParams.get('page')) || 1;
    const initialSearch = queryParams.get('q') || '';

    // State
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [meta, setMeta] = useState(null);

    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [campusFilter, setCampusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(initialPage);

    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    // Stats
    const [statsData, setStatsData] = useState({ total: 0, found: 0, lost: 0 });
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== debouncedSearch) {
                setDebouncedSearch(searchQuery);
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearch]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (activeTab !== 'all') params.set('type', activeTab);
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (currentPage > 1) params.set('page', currentPage);

        const newSearch = params.toString();
        if (location.search !== `?${newSearch}` && (location.search !== '' || newSearch !== '')) {
            navigate({ search: newSearch }, { replace: true });
        }
    }, [activeTab, debouncedSearch, currentPage, navigate, location.search]);

    const fetchReports = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');

            const params = { page: currentPage };
            if (activeTab !== 'all') params.type = activeTab;
            if (debouncedSearch) params.q = debouncedSearch;
            if (campusFilter) params.campus = campusFilter;

            const response = await api.get('/reports', { params });

            setReports(response.data.data);
            setMeta(response.data.meta);

            // Calculate stats from meta if available
            if (response.data.meta) {
                setStatsData(prev => ({ ...prev, total: response.data.meta.total }));
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports from the server. Please try again later.');
            if (!err.response) {
                setReports([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeTab, debouncedSearch, campusFilter]);

    // Fetch found/lost counts separately for stats
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [foundRes, lostRes] = await Promise.all([
                    api.get('/reports', { params: { type: 'found', page: 1 } }),
                    api.get('/reports', { params: { type: 'lost', page: 1 } }),
                ]);
                setStatsData(prev => ({
                    ...prev,
                    found: foundRes.data.meta?.total || 0,
                    lost: lostRes.data.meta?.total || 0,
                }));
            } catch (err) {
                console.error('Error fetching counts:', err);
            }
        };
        fetchCounts();
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handleCampusChange = (value) => {
        setCampusFilter(value);
        setCurrentPage(1);
    };

    const handleNextPage = () => {
        if (meta && currentPage < meta.last_page) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const clearFilters = () => {
        setActiveTab('all');
        setSearchQuery('');
        setDebouncedSearch('');
        setCampusFilter('');
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-page font-sans pb-20">
            <UserBar />

            <main className="container mx-auto px-4 py-8">

                {/* Welcome Area */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-wide uppercase text-text-dark mb-2">
                        Dashboard
                    </h1>
                    <p className="text-text-muted">
                        Welcome back, <span className="font-semibold text-text-dark">{user?.name || 'User'}</span>!
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <motion.div 
                        initial={prefersReduced ? {} : { opacity: 0 }}
                        animate={prefersReduced ? {} : { opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="text-text-muted text-xs uppercase tracking-widest font-bold mb-2">Total Active Reports</h3>
                        <p className="text-3xl font-bold text-white">{meta?.total || statsData.total}</p>
                    </motion.div>
                    <motion.div 
                        initial={prefersReduced ? {} : { opacity: 0 }}
                        animate={prefersReduced ? {} : { opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="text-text-muted text-xs uppercase tracking-widest font-bold mb-2">Items Found</h3>
                        <p className="text-3xl font-bold text-emerald-400">{statsData.found}</p>
                    </motion.div>
                    <motion.div 
                        initial={prefersReduced ? {} : { opacity: 0 }}
                        animate={prefersReduced ? {} : { opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="text-text-muted text-xs uppercase tracking-widest font-bold mb-2">Items Lost</h3>
                        <p className="text-3xl font-bold text-red-400">{statsData.lost}</p>
                    </motion.div>
                </div>

                {/* Filter Tabs + Search */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    {/* Tabs */}
                    <div className="flex gap-2 relative z-0">
                        {['all', 'found', 'lost'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider relative transition-colors ${activeTab === tab
                                        ? 'text-black'
                                        : 'text-text-muted hover:text-text-dark'
                                    }`}
                            >
                                {activeTab === tab && !prefersReduced && (
                                    <motion.div
                                        layoutId="dashboardTabIndicator"
                                        className="absolute inset-0 bg-accent rounded-full -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {activeTab === tab && prefersReduced && (
                                    <div className="absolute inset-0 bg-accent rounded-full -z-10" />
                                )}
                                {tab === 'all' ? 'All Items' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={16} className="text-text-muted" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search item names..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-text-dark focus:border-accent focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Campus filter */}
                    <select
                        value={campusFilter}
                        onChange={(e) => handleCampusChange(e.target.value)}
                        className="bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-text-dark focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer w-full md:w-auto"
                    >
                        <option value="">All Campuses</option>
                        <option value="arlegui">Arlegui</option>
                        <option value="casal">Casal</option>
                        <option value="outside">Outside TIP</option>
                    </select>
                </div>

                {/* Reports Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="font-semibold uppercase tracking-wider">Loading reports...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-6 flex flex-col items-center justify-center py-12">
                        <AlertCircle size={40} className="mb-4" />
                        <p className="font-medium text-center">{error}</p>
                        <button onClick={fetchReports} className="mt-4 btn-amber">
                            Try Again
                        </button>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <div className="bg-page w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Filter size={32} className="text-text-muted" />
                        </div>
                        <h3 className="text-xl font-bold text-text-dark mb-2 uppercase tracking-wide">No items found</h3>
                        <p className="text-text-muted max-w-sm mx-auto">
                            We couldn't find any reports matching your current filters or search query.
                        </p>
                        {(activeTab !== 'all' || searchQuery !== '') && (
                            <button
                                onClick={clearFilters}
                                className="mt-6 btn-amber"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {reports.map((report, index) => (
                                <motion.div
                                    key={report.id}
                                    initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
                                    animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                                    transition={prefersReduced ? {} : { delay: index * 0.05, duration: 0.4 }}
                                >
                                    <ReportCard report={report} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta && meta.last_page > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                            : 'bg-card text-white hover:bg-accent hover:text-black cursor-pointer'
                                        }`}
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <span className="text-sm font-bold text-text-muted uppercase tracking-wider">
                                    Page <span className="text-text-dark mx-1">{meta.current_page}</span> of <span className="text-text-dark ml-1">{meta.last_page}</span>
                                </span>

                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === meta.last_page}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${currentPage === meta.last_page
                                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                            : 'bg-card text-white hover:bg-accent hover:text-black cursor-pointer'
                                        }`}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}

            </main>
        </div>
    );
};

export default Dashboard;
