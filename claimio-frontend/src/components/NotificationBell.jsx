import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, XCircle, Link as LinkIcon, Clock } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data.success) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unread_count);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            const res = await api.post(`/notifications/${id}/read`);
            if (res.data.success) {
                setNotifications(prev => 
                    prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await api.post('/notifications/read');
            if (res.data.success) {
                setNotifications(prev => 
                    prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const toggleDropdown = () => setIsOpen(!isOpen);

    const getIcon = (type) => {
        switch (type) {
            case 'claim_approved': return <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />;
            case 'claim_rejected': return <XCircle className="text-red-500 shrink-0" size={18} />;
            case 'item_matched': return <LinkIcon className="text-blue-500 shrink-0" size={18} />;
            case 'report_expired': return <Clock className="text-gray-400 shrink-0" size={18} />;
            default: return <Bell className="text-accent shrink-0" size={18} />;
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={toggleDropdown}
                className="relative p-2 rounded-full text-text-muted hover:text-white hover:bg-card transition-colors duration-200"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <motion.span 
                        animate={prefersReduced ? {} : { scale: [1, 1.1, 1] }}
                        transition={prefersReduced ? {} : { repeat: Infinity, duration: 2 }}
                        className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border border-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={prefersReduced ? {} : { opacity: 0, scale: 0.95, y: -10 }}
                    animate={prefersReduced ? {} : { opacity: 1, scale: 1, y: 0 }}
                    exit={prefersReduced ? {} : { opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-2xl rounded-xl origin-top-right overflow-hidden z-50"
                >
                    <div className="px-4 py-3 border-b border-border bg-card-alt flex justify-between items-center">
                        <h3 className="font-bold text-white uppercase tracking-wider text-xs">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {unreadCount} New
                            </span>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-text-muted">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {notifications.slice(0, 5).map((notification, idx) => (
                                    <motion.div
                                        initial={prefersReduced ? {} : { opacity: 0, x: 20 }}
                                        animate={prefersReduced ? {} : { opacity: 1, x: 0 }}
                                        transition={prefersReduced ? {} : { delay: idx * 0.05, duration: 0.3 }}
                                        key={notification.id}
                                        onClick={() => !notification.read_at && markAsRead(notification.id)}
                                        className={`p-4 hover:bg-card-alt transition-colors cursor-pointer flex gap-3
                                            ${!notification.read_at ? 'bg-accent/5' : ''}
                                        `}
                                    >
                                        <div className="mt-1">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm leading-snug ${!notification.read_at ? 'text-white font-medium' : 'text-gray-300'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-text-muted mt-1 uppercase font-bold tracking-wider">
                                                {formatTimeAgo(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.read_at && (
                                            <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5 shadow-[0_0_8px_rgba(var(--accent),0.8)]"></div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.some(n => !n.read_at) && (
                        <div className="border-t border-border p-2 bg-card-alt">
                            <button
                                onClick={markAllAsRead}
                                className="w-full text-center text-xs font-bold uppercase tracking-wider text-text-muted hover:text-white py-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Mark all as read
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
