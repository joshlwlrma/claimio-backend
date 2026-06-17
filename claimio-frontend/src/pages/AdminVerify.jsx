import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

const AdminVerify = () => {
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();
    const { setSession } = useAuth();

    const queryParams = new URLSearchParams(location.search);
    const tempToken = queryParams.get('temp_token');

    useEffect(() => {
        if (!tempToken) {
            navigate('/login', { replace: true });
        }
    }, [tempToken, navigate]);

    const handlePinChange = (index, value) => {
        if (!/^[0-9]?$/.test(value)) return;
        
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`pin-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            document.getElementById(`pin-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const pinString = pin.join('');
        if (pinString.length !== 6) {
            setError('Please enter all 6 digits.');
            return;
        }

        if (attempts >= 3) {
            setError('Too many failed attempts. Please login again.');
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data } = await api.post('/auth/admin/verify', 
                { pin: pinString },
                { headers: { Authorization: `Bearer ${tempToken}` } }
            );

            // Set the real token and navigate to dashboard
            setSession(data.token, data.user);
            navigate('/admin', { replace: true });
        } catch (err) {
            const errMessage = err.response?.data?.message || 'Verification failed.';
            setError(errMessage);
            setAttempts(prev => prev + 1);
            setPin(['', '', '', '', '', '']);
            document.getElementById('pin-0').focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500"></div>
                
                <div className="flex justify-center mb-6">
                    <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20">
                        <ShieldAlert size={32} className="text-red-500" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-2">Admin Verification</h2>
                <p className="text-text-muted text-sm text-center mb-8">
                    Please enter the 6-digit admin PIN to verify your identity.
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center mb-6">
                        {error} {attempts > 0 && attempts < 3 && `(${3 - attempts} attempts left)`}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex justify-between gap-2">
                        {pin.map((digit, i) => (
                            <input
                                key={i}
                                id={`pin-${i}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handlePinChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="w-12 h-14 text-center text-xl font-bold bg-card-alt border border-border rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || attempts >= 3 || pin.join('').length !== 6}
                        className="w-full btn bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminVerify;
