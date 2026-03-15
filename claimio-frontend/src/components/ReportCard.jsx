import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle2, ChevronRight, Search } from 'lucide-react';

const ReportCard = ({ report }) => {

    // Choose badge color based on type
    const isLost = report.type === 'lost';
    const typeBadgeClass = isLost ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';

    // Format date safely
    const formattedDate = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Unknown date';

    return (
        <div className="bg-landing-surface border border-landing-border rounded-xl overflow-hidden hover:border-landing-gray/50 transition-colors flex flex-col h-full shadow-lg group">

            {/* Image / Thumbnail Placeholder */}
            <div className="h-48 w-full bg-black relative flex items-center justify-center overflow-hidden border-b border-landing-border">
                {report.images && report.images.length > 0 ? (
                    <img
                        src={report.images[0].url}
                        alt={report.item_name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => { e.target.src = ''; e.target.className = 'hidden'; }}
                    />
                ) : (
                    <Search className="text-landing-border w-12 h-12" />
                )}

                {/* Status Badge overlays image */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeBadgeClass}`}>
                    {report.type}
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 truncate">{report.item_name}</h3>

                <p className="text-landing-gray text-sm line-clamp-2 mb-4 flex-grow">
                    {report.description}
                </p>

                <div className="space-y-2 mt-auto">
                    <div className="flex items-center text-landing-gray text-xs">
                        <MapPin size={14} className="mr-2" />
                        <span className="truncate">{report.location}</span>
                    </div>
                    <div className="flex items-center text-landing-gray text-xs">
                        <Calendar size={14} className="mr-2" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center text-landing-gray text-xs">
                        <CheckCircle2 size={14} className="mr-2" />
                        <span className="capitalize text-landing-gray font-medium">Status: {report.status}</span>
                    </div>
                </div>

            </div>

            <div className="px-5 py-4 border-t border-landing-border bg-black/50">
                <Link to={`/reports/${report.id}`} className="flex items-center justify-between text-landing-gray group-hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider">
                    <span>View Details</span>
                    <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

        </div>
    );
};

export default ReportCard;
