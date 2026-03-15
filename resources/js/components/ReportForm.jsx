import React, { useState } from 'react';
import axios from 'axios';

/**
 * ReportForm — Lost & Found Report Submission
 *
 * Collects report details + up to 5 images, sends as multipart/form-data
 * to POST /api/reports with a Sanctum Bearer token.
 *
 * Props:
 *  - apiBaseUrl  (string)  — base URL for the API, e.g. "http://localhost:8000"
 *  - authToken   (string)  — Sanctum bearer token from Google OAuth login
 *  - onSuccess   (func)    — callback after successful submission (receives report data)
 */

const CATEGORIES = [
    'Electronics',
    'Clothing',
    'Bags & Wallets',
    'ID & Documents',
    'Keys',
    'Books & Supplies',
    'Accessories',
    'Others',
];

export default function ReportForm({ apiBaseUrl, authToken, onSuccess }) {
    // ── Form state ──────────────────────────────────
    const [formData, setFormData] = useState({
        type: 'lost',
        item_name: '',
        category: '',
        description: '',
        location: '',
        date_occurrence: '',
        contact_number: '',
    });

    const [images, setImages] = useState([]);          // File[]
    const [previews, setPreviews] = useState([]);       // data-URL strings for preview
    const [errors, setErrors] = useState({});           // field → [messages]
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // ── Handlers ────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error for this field on change
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        // Client-side guard: max 5 images
        if (files.length > 5) {
            setErrors((prev) => ({
                ...prev,
                images: ['You may upload a maximum of 5 images.'],
            }));
            return;
        }

        setImages(files);
        setErrors((prev) => {
            const next = { ...prev };
            delete next.images;
            delete next['images.0'];
            delete next['images.1'];
            delete next['images.2'];
            delete next['images.3'];
            delete next['images.4'];
            return next;
        });

        // Generate thumbnails for preview
        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviews(urls);
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        // Revoke old object URL to free memory
        URL.revokeObjectURL(previews[index]);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMsg('');
        setIsSubmitting(true);

        // Build multipart FormData
        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            payload.append(key, value);
        });
        images.forEach((file) => {
            payload.append('images[]', file);
        });

        try {
            const response = await axios.post(
                `${apiBaseUrl}/api/reports`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Success
            setSuccessMsg(response.data.message || 'Report submitted successfully!');
            // Reset form
            setFormData({
                type: 'lost',
                item_name: '',
                category: '',
                description: '',
                location: '',
                date_occurrence: '',
                contact_number: '',
            });
            setImages([]);
            previews.forEach((url) => URL.revokeObjectURL(url));
            setPreviews([]);

            if (onSuccess) {
                onSuccess(response.data.data);
            }
        } catch (err) {
            if (err.response && err.response.status === 422) {
                // Laravel validation errors: { errors: { field: [msg, ...] } }
                setErrors(err.response.data.errors || {});
            } else if (err.response && err.response.status === 401) {
                setErrors({ general: ['You must be logged in to submit a report.'] });
            } else {
                setErrors({ general: ['Something went wrong. Please try again.'] });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Helper: render field error ──────────────────
    const fieldError = (field) => {
        // Check for exact match and indexed variants (images.0, images.1, etc.)
        const msgs = errors[field] || [];
        return msgs.length > 0 ? (
            <ul className="error-list">
                {msgs.map((msg, i) => (
                    <li key={i} className="error-msg">{msg}</li>
                ))}
            </ul>
        ) : null;
    };

    // ── Render ──────────────────────────────────────
    return (
        <div className="report-form-container">
            <h2>Submit a Report</h2>

            {/* General / auth errors */}
            {errors.general && (
                <div className="alert alert-error">
                    {errors.general.map((msg, i) => <p key={i}>{msg}</p>)}
                </div>
            )}

            {/* Success toast */}
            {successMsg && (
                <div className="alert alert-success">
                    <p>{successMsg}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
                {/* ── Report Type ── */}
                <div className="form-group">
                    <label htmlFor="type">Report Type *</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    >
                        <option value="lost">Lost Item</option>
                        <option value="found">Found Item</option>
                    </select>
                    {fieldError('type')}
                </div>

                {/* ── Item Name ── */}
                <div className="form-group">
                    <label htmlFor="item_name">Item Name *</label>
                    <input
                        id="item_name"
                        type="text"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleChange}
                        placeholder="e.g. Blue Nike Backpack"
                        maxLength={255}
                        required
                    />
                    {fieldError('item_name')}
                </div>

                {/* ── Category ── */}
                <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">— Select Category —</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    {fieldError('category')}
                </div>

                {/* ── Description ── */}
                <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide details about the item — color, brand, distinguishing marks, etc."
                        maxLength={2000}
                        rows={4}
                        required
                    />
                    {fieldError('description')}
                </div>

                {/* ── Location ── */}
                <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                        id="location"
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Library 2nd Floor, Room 301"
                        maxLength={255}
                        required
                    />
                    {fieldError('location')}
                </div>

                {/* ── Date of Occurrence ── */}
                <div className="form-group">
                    <label htmlFor="date_occurrence">Date of Occurrence *</label>
                    <input
                        id="date_occurrence"
                        type="date"
                        name="date_occurrence"
                        value={formData.date_occurrence}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                        required
                    />
                    {fieldError('date_occurrence')}
                </div>

                {/* ── Contact Number ── */}
                <div className="form-group">
                    <label htmlFor="contact_number">Contact Number</label>
                    <input
                        id="contact_number"
                        type="tel"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder="e.g. 09171234567"
                        maxLength={20}
                    />
                    {fieldError('contact_number')}
                </div>

                {/* ── Image Upload ── */}
                <div className="form-group">
                    <label htmlFor="images">Upload Images (max 5, JPG/PNG, 5 MB each)</label>
                    <input
                        id="images"
                        type="file"
                        name="images"
                        accept="image/jpeg,image/png,image/jpg"
                        multiple
                        onChange={handleImageChange}
                    />
                    {fieldError('images')}
                    {/* Show errors for individual image indices */}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <React.Fragment key={i}>
                            {fieldError(`images.${i}`)}
                        </React.Fragment>
                    ))}
                </div>

                {/* ── Image Previews ── */}
                {previews.length > 0 && (
                    <div className="image-previews">
                        {previews.map((src, i) => (
                            <div key={i} className="preview-item">
                                <img src={src} alt={`Preview ${i + 1}`} />
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => removeImage(i)}
                                    title="Remove image"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Submit ── */}
                <button
                    type="submit"
                    className="btn-submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting…' : 'Submit Report'}
                </button>
            </form>
        </div>
    );
}
