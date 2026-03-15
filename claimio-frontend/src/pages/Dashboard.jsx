import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UserBar from '../components/UserBar';
import ReportCard from '../components/ReportCard';
import api from '../services/api';
import { Search, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    const [meta, setMeta] = useState(null); // Pagination metadata

    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [currentPage, setCurrentPage] = useState(initialPage);

    // Debounce search query so we don't spam the API on every keystroke
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== debouncedSearch) {
                setDebouncedSearch(searchQuery);
                setCurrentPage(1); // Reset to page 1 on new search
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearch]);

    // Update URL when state changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (activeTab !== 'all') params.set('type', activeTab);
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (currentPage > 1) params.set('page', currentPage);
        
        const newSearch = params.toString();
        // Only navigate if the URL actually needs to change, preventing unnecessary history entries
        if (location.search !== `?${newSearch}` && (location.search !== '' || newSearch !== '')) {
             navigate({ search: newSearch }, { replace: true });
        }
    }, [activeTab, debouncedSearch, currentPage, navigate, location.search]);

    // Fetch reports when dependencies change (tab, search, or page)
    const fetchReports = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');
            
            const params = { page: currentPage };
            if (activeTab !== 'all') params.type = activeTab;
            if (debouncedSearch) params.q = debouncedSearch;

            const response = await api.get('/reports', { params });
            
            setReports(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports from the server. Please try again later.');
            
            // Fallback demo data ONLY if API completely fails, not for zero results
            if (!err.response) {
                setReports([
                    { id: 1, type: 'lost', item_name: 'MacBook Pro', description: 'Silver 14" M1 Pro, last seen in Library 3rd floor.', location: 'Library, Building A', status: 'open', created_at: '2023-11-20T10:00:00Z', images: [] },
                    { id: 2, type: 'found', item_name: 'Blue Hydroflask', description: 'With lots of stickers, found near the cafeteria entrance.', location: 'Cafeteria', status: 'open', created_at: '2023-11-21T14:30:00Z', images: [] },
                ]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeTab, debouncedSearch]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Handlers
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset to page 1 when changing tabs
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
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-landing-dark font-sans text-white pb-20">
            <UserBar />

            <main className="container mx-auto px-4 py-8">

                {/* Welcome Area */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-wide mb-2 uppercase text-white">Dashboard</h1>
                    <p className="text-landing-gray">
                        Welcome back, <span className="font-semibold text-white">{user?.name || 'User'}</span>! Here are the latest items reported on campus.
                    </p>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-landing-surface border border-landing-border rounded-xl p-6 shadow-2xl">
                        <h3 className="text-landing-gray text-xs uppercase tracking-widest font-bold mb-2">Total Active Reports</h3>
                        <p className="text-3xl font-bold text-white">{meta?.total || reports.length}</p>
                    </div>
                    {/* The specific count by type relies on API now, we don't have the full list. Hide stats if backend doesn't provide them, or keep placeholder logic for now */}
                    <div className="bg-landing-surface border border-landing-border rounded-xl p-6 shadow-2xl">
                        <h3 className="text-landing-gray text-xs uppercase tracking-widest font-bold mb-2">My Reports</h3>
                        <p className="text-3xl font-bold text-white">View Profile →</p>
                    </div>
                    <div className="bg-landing-surface border border-landing-border rounded-xl p-6 shadow-2xl">
                        <h3 className="text-landing-gray text-xs uppercase tracking-widest font-bold mb-2">My Claims</h3>
                        <p className="text-3xl font-bold text-white">View Profile →</p>
                    </div>
                </div>

                {/* Controls: Search and Filter Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-landing-surface p-4 rounded-xl border border-landing-border shadow-md">

                    {/* Tabs */}
                    <div className="flex bg-black p-1 rounded-lg w-full md:w-auto border border-landing-border">
                        <button
                            onClick={() => handleTabChange('all')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'all' ? 'bg-white text-black shadow' : 'text-landing-gray hover:text-white'}`}
                        >
                            All Items
                        </button>
                        <button
                            onClick={() => handleTabChange('found')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'found' ? 'bg-emerald-500 text-white shadow' : 'text-landing-gray hover:text-white'}`}
                        >
                            Found
                        </button>
                        <button
                            onClick={() => handleTabChange('lost')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'lost' ? 'bg-red-500 text-white shadow' : 'text-landing-gray hover:text-white'}`}
                        >
                            Lost
                        </button>
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-landing-gray" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search item names..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-black border border-landing-border rounded-lg text-sm text-white focus:border-white focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Reports Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-landing-gray">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="font-semibold uppercase tracking-wider">Loading reports...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-6 flex flex-col items-center justify-center py-12">
                        <AlertCircle size={40} className="mb-4" />
                        <p className="font-medium text-center">{error}</p>
                        <button onClick={fetchReports} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-red-600 transition-colors">
                            Try Again
                        </button>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-landing-surface border border-landing-border rounded-xl p-12 text-center shadow-lg">
                        <div className="bg-black w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-landing-border">
                            <Filter size={32} className="text-landing-gray" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">No items found</h3>
                        <p className="text-landing-gray max-w-sm mx-auto">
                            We couldn't find any reports matching your current filters or search query.
                        </p>
                        {(activeTab !== 'all' || searchQuery !== '') && (
                            <button
                                onClick={clearFilters}
                                className="mt-6 text-sm font-bold text-white uppercase tracking-wider hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {reports.map(report => (
                                <ReportCard key={report.id} report={report} />
                            ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {meta && meta.last_page > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                        currentPage === 1 
                                            ? 'bg-landing-surface border border-landing-border text-landing-gray opacity-50 cursor-not-allowed' 
                                            : 'bg-landing-surface border border-landing-border text-white hover:bg-white hover:text-black cursor-pointer'
                                    }`}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                
                                <span className="text-sm font-bold text-landing-gray uppercase tracking-wider">
                                    Page <span className="text-white mx-1">{meta.current_page}</span> of <span className="text-white ml-1">{meta.last_page}</span>
                                </span>

                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === meta.last_page}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                        currentPage === meta.last_page 
                                            ? 'bg-landing-surface border border-landing-border text-landing-gray opacity-50 cursor-not-allowed' 
                                            : 'bg-landing-surface border border-landing-border text-white hover:bg-white hover:text-black cursor-pointer'
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
