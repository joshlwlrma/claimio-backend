import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBar from '../components/UserBar';
import api from '../services/api';
import { Upload, X, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react';

const ReportForm = () => {
    const navigate = useNavigate();

    // Form state
    const [type, setType] = useState('');
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [campus, setCampus] = useState('');
    const [isSensitive, setIsSensitive] = useState(false);
    const [nameOnItem, setNameOnItem] = useState('');

    // Image handling
    const [images, setImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Step tracking
    const [step, setStep] = useState(1);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (images.length + files.length > 5) {
            setError('You can only upload a maximum of 5 images.');
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    };

    const removeImage = (index) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviewUrls = [...previewUrls];
        URL.revokeObjectURL(newPreviewUrls[index]);
        newPreviewUrls.splice(index, 1);
        setPreviewUrls(newPreviewUrls);
    };

    const handleStep1Submit = (e) => {
        e.preventDefault();
        if (!type) {
            setError('Please select whether you lost or found something.');
            return;
        }
        if (!campus) {
            setError('Please select a campus.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const formData = new FormData();
        formData.append('type', type);
        formData.append('item_name', itemName);
        formData.append('description', description);
        formData.append('location', location);
        formData.append('campus', campus);
        formData.append('is_sensitive', isSensitive ? 1 : 0);
        if (isSensitive) {
            formData.append('name_on_item', nameOnItem);
        }

        images.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
        });

        try {
            await api.post('/reports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            previewUrls.forEach(url => URL.revokeObjectURL(url));
            navigate('/dashboard');
        } catch (err) {
            console.error("Report submission failed:", err);
            if (err.response?.data?.errors) {
                const firstErrorKey = Object.keys(err.response.data.errors)[0];
                setError(err.response.data.errors[firstErrorKey][0]);
            } else {
                setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-page font-sans pb-12">
            <UserBar />

            <main className="container mx-auto px-4 py-8 max-w-3xl">

                {/* Back Link */}
                <button
                    onClick={() => step === 2 ? setStep(1) : navigate('/dashboard')}
                    className="flex items-center text-text-muted hover:text-text-dark transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    {step === 2 ? 'Back to Step 1' : 'Go Back to Dashboard'}
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-dark uppercase tracking-wide mb-2">
                        Submit A Report
                    </h1>
                    <p className="text-text-muted text-sm">
                        {step === 1 ? 'Fill out the details below to report an item.' : 'Upload images of the item (optional).'}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-8">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-accent text-black' : 'bg-gray-200 text-text-muted'}`}>
                        1
                    </div>
                    <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-gray-200'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-accent text-black' : 'bg-gray-200 text-text-muted'}`}>
                        2
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                        {error}
                    </div>
                )}

                {/* STEP 1: Details */}
                {step === 1 && (
                    <form onSubmit={handleStep1Submit} className="space-y-6">

                        {/* Type Selection */}
                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider text-text-muted mb-3">Report Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setType('lost')}
                                    className={`p-5 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                                        type === 'lost'
                                            ? 'border-accent bg-accent/10 text-accent'
                                            : 'border-gray-200 bg-white text-text-muted hover:border-gray-300'
                                    }`}
                                >
                                    <span className="font-bold uppercase tracking-wide text-sm">I Lost Something</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('found')}
                                    className={`p-5 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                                        type === 'found'
                                            ? 'border-accent bg-accent/10 text-accent'
                                            : 'border-gray-200 bg-white text-text-muted hover:border-gray-300'
                                    }`}
                                >
                                    <span className="font-bold uppercase tracking-wide text-sm">I Found Something</span>
                                </button>
                            </div>
                        </div>

                        {/* Item Name */}
                        <div>
                            <label htmlFor="itemName" className="block text-sm font-bold uppercase tracking-wider text-text-muted mb-2">Item Name</label>
                            <input
                                id="itemName"
                                type="text"
                                required
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                placeholder="e.g. Blue Hydroflask, Apple AirPods..."
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-text-dark focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-bold uppercase tracking-wider text-text-muted mb-2">
                                {type === 'found' ? 'Found Location' : 'Last Seen Location'}
                            </label>
                            <input
                                id="location"
                                type="text"
                                required
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Library 3rd Floor, Cafeteria Table 5"
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-text-dark focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-bold uppercase tracking-wider text-text-muted mb-2">Description / Additional Details</label>
                            <textarea
                                id="description"
                                required
                                rows="4"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide identifying features, brand, color, or context..."
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-text-dark focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-text-muted/50"
                            />
                        </div>

                        {/* Campus */}
                        <div>
                            <label htmlFor="campus" className="block text-sm font-bold uppercase tracking-wider text-text-muted mb-2">Campus</label>
                            <select
                                id="campus"
                                required
                                value={campus}
                                onChange={(e) => setCampus(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-text-dark focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">Select campus...</option>
                                <option value="arlegui">Arlegui Campus</option>
                                <option value="casal">Casal Campus</option>
                                <option value="outside">Outside TIP</option>
                            </select>
                        </div>

                        {/* Sensitive Item Flag */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                            <label className="flex flex-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isSensitive}
                                    onChange={(e) => setIsSensitive(e.target.checked)}
                                    className="mt-1 w-5 h-5 text-accent rounded border-gray-300 focus:ring-accent cursor-pointer shrink-0"
                                />
                                <div>
                                    <span className="block text-sm font-bold text-text-dark">
                                        This item contains an ID or document with a name on it
                                    </span>
                                </div>
                            </label>

                            {isSensitive && (
                                <div className="mt-4 pl-8">
                                    <label htmlFor="nameOnItem" className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                                        Name on item <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="nameOnItem"
                                        type="text"
                                        required
                                        value={nameOnItem}
                                        onChange={(e) => setNameOnItem(e.target.value)}
                                        placeholder="e.g. Juan Fangonilo"
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-text-dark text-sm focus:outline-none focus:border-accent transition-colors"
                                    />
                                    <p className="text-xs text-text-muted mt-2">
                                        Will be shown publicly as initials only (e.g. J. Fangonilo)
                                    </p>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn-amber w-full py-3.5 text-center">
                            Continue to Images
                        </button>
                    </form>
                )}

                {/* STEP 2: Images */}
                {step === 2 && (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider text-text-muted mb-3">Images (Optional, Max 5)</label>

                            {images.length < 5 && (
                                <label className="border-2 border-dashed border-gray-300 bg-white rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors group">
                                    <div className="bg-page w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-black transition-colors text-text-muted">
                                        <Upload size={24} />
                                    </div>
                                    <span className="text-sm text-text-muted font-medium group-hover:text-text-dark transition-colors">Click to upload images</span>
                                    <span className="text-xs text-text-muted/60 mt-1">JPEG, PNG up to 2MB</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            {previewUrls.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white group">
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
                                    {Array.from({ length: Math.max(0, 5 - previewUrls.length) }).map((_, idx) => (
                                        <div key={`empty-${idx}`} className="aspect-square rounded-xl border border-dashed border-gray-200 bg-page flex items-center justify-center">
                                            <ImageIcon size={20} className="text-text-muted/20" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Report Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Type:</span>
                                    <span className={`font-bold uppercase ${type === 'lost' ? 'text-red-400' : 'text-emerald-400'}`}>{type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Item:</span>
                                    <span className="text-white font-semibold">{itemName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Location:</span>
                                    <span className="text-white">{location}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Campus:</span>
                                    <span className="text-white capitalize">{campus || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Images:</span>
                                    <span className="text-white">{images.length} attached</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-amber w-full py-3.5 text-center flex items-center justify-center"
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
                    </form>
                )}
            </main>
        </div>
    );
};

export default ReportForm;
