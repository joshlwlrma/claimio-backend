import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBar from '../components/UserBar';
import api from '../services/api';
import { Upload, X, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react';

const ReportForm = () => {
    const navigate = useNavigate();

    // Form state
    const [type, setType] = useState('lost'); // 'lost' or 'found'
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');

    // Image handling
    const [images, setImages] = useState([]); // File objects
    const [previewUrls, setPreviewUrls] = useState([]); // Object URLs for display

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        // Validate maximum 5 images total
        if (images.length + files.length > 5) {
            setError('You can only upload a maximum of 5 images.');
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        // Create preview URLs
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    };

    const removeImage = (index) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviewUrls = [...previewUrls];
        // Revoke object URL to prevent memory leaks
        URL.revokeObjectURL(newPreviewUrls[index]);
        newPreviewUrls.splice(index, 1);
        setPreviewUrls(newPreviewUrls);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Prepare FormData
        const formData = new FormData();
        formData.append('type', type);
        formData.append('item_name', itemName);
        formData.append('description', description);
        formData.append('location', location);

        // Append images
        images.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
        });

        try {
            // POST to backend API
            const response = await api.post('/reports', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Cleanup Object URLs on success
            previewUrls.forEach(url => URL.revokeObjectURL(url));

            // Redirect to dashboard on success
            navigate('/dashboard');

        } catch (err) {
            console.error("Report submission failed:", err);
            // Determine error string from standard validation or raw message
            if (err.response?.data?.errors) {
                const firstErrorKey = Object.keys(err.response.data.errors)[0];
                setError(err.response.data.errors[firstErrorKey][0]);
            } else {
                setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
            }

            // Demo fallback logic for the frontend visually doing work
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-landing-dark font-sans text-white">
            <UserBar />

            <main className="container mx-auto px-4 py-8 max-w-3xl">

                {/* Back Link */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-landing-gray hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Dashboard
                </button>

                <div className="bg-landing-surface border border-landing-border rounded-2xl shadow-2xl overflow-hidden">

                    <div className="p-8 border-b border-landing-border bg-black/50">
                        <h1 className="text-2xl font-extrabold tracking-wide uppercase text-white mb-2">Submit a Report</h1>
                        <p className="text-landing-gray text-sm">Fill out the details below to report an item you lost or found on campus.</p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-semibold">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-landing-gray mb-3">Report Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setType('lost')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${type === 'lost'
                                            ? 'border-red-500 bg-red-500/10 text-red-500 shadow-sm'
                                            : 'border-landing-border bg-black text-landing-gray hover:border-landing-gray'
                                            }`}
                                    >
                                        <span className="font-extrabold uppercase tracking-wide">I Lost Something</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('found')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${type === 'found'
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm'
                                            : 'border-landing-border bg-black text-landing-gray hover:border-landing-gray'
                                            }`}
                                    >
                                        <span className="font-extrabold uppercase tracking-wide">I Found Something</span>
                                    </button>
                                </div>
                            </div>

                            {/* Item Name */}
                            <div>
                                <label htmlFor="itemName" className="block text-sm font-bold uppercase tracking-wider text-landing-gray mb-2">Item Name</label>
                                <input
                                    id="itemName"
                                    type="text"
                                    required
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="e.g. Blue Hydroflask, Apple AirPods..."
                                    className="w-full bg-black border border-landing-border rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white transition-colors placeholder:text-landing-gray/40"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label htmlFor="location" className="block text-sm font-bold uppercase tracking-wider text-landing-gray mb-2">
                                    {type === 'lost' ? 'Last Seen Location' : 'Found Location'}
                                </label>
                                <input
                                    id="location"
                                    type="text"
                                    required
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Library 3rd Floor, Cafeteria Table 5"
                                    className="w-full bg-black border border-landing-border rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white transition-colors placeholder:text-landing-gray/40"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-bold uppercase tracking-wider text-landing-gray mb-2">Description / Additional Details</label>
                                <textarea
                                    id="description"
                                    required
                                    rows="4"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide identifying features, brand, color, or context..."
                                    className="w-full bg-black border border-landing-border rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white transition-colors resize-none placeholder:text-landing-gray/40"
                                ></textarea>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-landing-gray mb-2">Images (Optional, Max 5)</label>

                                {/* Upload Zone */}
                                {images.length < 5 && (
                                    <label className="border-2 border-dashed border-landing-border bg-black rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-landing-surface hover:border-landing-gray transition-colors group">
                                        <div className="bg-landing-surface w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:bg-white transition-colors text-landing-gray group-hover:text-black shadow-lg">
                                            <Upload size={24} />
                                        </div>
                                        <span className="text-sm text-landing-gray font-medium group-hover:text-white transition-colors">Click to upload images</span>
                                        <span className="text-xs text-landing-gray/60 mt-1">JPEG, PNG up to 2MB</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}

                                {/* Image Previews */}
                                {previewUrls.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {previewUrls.map((url, index) => (
                                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-landing-border bg-black group">
                                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {/* Fill empty spots with dashed outlines */}
                                        {Array.from({ length: Math.max(0, 5 - previewUrls.length) }).map((_, idx) => (
                                            <div key={`empty-${idx}`} className="aspect-square rounded-lg border border-dashed border-landing-border bg-black/30 flex items-center justify-center">
                                                <ImageIcon size={20} className="text-landing-gray/20" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-6 border-t border-landing-border">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-white text-black font-extrabold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2" size={20} />
                                            Submitting...
                                        </>
                                    ) : (
                                        `Submit ${type === 'lost' ? 'Lost' : 'Found'} Report`
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportForm;
