import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ChevronRight, Search, Clock, Lock } from 'lucide-react';

const ReportCard = ({ report }) => {

    const isLost = report.type === 'lost';

    const formattedDate = report.created_at
        ? new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Unknown date';

    const formattedTime = report.created_at
        ? new Date(report.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full group border border-gray-100">

            {/* Image / Thumbnail */}
            <div className="h-48 w-full bg-card relative flex items-center justify-center overflow-hidden">
                {report.images && report.images.length > 0 ? (
                    <>
                        <img
                            src={report.images[0].url}
                            alt={report.item_name}
                            className={`w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 ${report.is_sensitive ? 'blur-md brightness-75' : ''}`}
                            onError={(e) => { e.target.src = ''; e.target.className = 'hidden'; }}
                        />
                        {report.is_sensitive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
                                <div className="bg-black/60 p-3 rounded-full mb-2 backdrop-blur-sm">
                                    <Lock size={20} className="text-accent" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                                    Sensitive Item
                                </span>
                            </div>
                        )}
                    </>
                ) : (
                    <Search className="text-text-muted/30 w-12 h-12" />
                )}

                {/* Type Badge top-right */}
                <div className={`absolute top-3 right-3 badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
                    {report.type}
                </div>
            </div>

            {/* Dark bottom section */}
            <div className="bg-card p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-base text-white mb-2 line-clamp-1">
                    {report.item_name}
                </h3>

                <p className="text-text-muted text-xs line-clamp-2 mb-4 flex-grow">
                    {report.is_sensitive && report.name_on_item 
                        ? report.name_on_item 
                        : (report.description || 'No description available')}
                </p>

                <div className="space-y-1.5">
                    {report.location && (
                        <div className="flex items-center text-text-muted text-xs">
                            <MapPin size={12} className="mr-2 shrink-0" />
                            <span className="truncate">{report.location}</span>
                        </div>
                    )}
                    <div className="flex items-center text-text-muted text-xs">
                        <Calendar size={12} className="mr-2 shrink-0" />
                        <span>{formattedDate}</span>
                    </div>
                    {formattedTime && (
                        <div className="flex items-center text-text-muted text-xs">
                            <Clock size={12} className="mr-2 shrink-0" />
                            <span>{formattedTime}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Amber bottom bar */}
            <Link
                to={`/reports/${report.id}`}
                className="bg-accent px-5 py-3 flex items-center justify-between text-black text-xs font-bold uppercase tracking-wider hover:bg-accent-dark transition-colors"
            >
                <span>View Details</span>
                <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>

        </div>
    );
};

export default ReportCard;
