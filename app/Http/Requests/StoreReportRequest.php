<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreReportRequest
 *
 * Validates incoming data for creating a new lost/found report.
 * Runs automatically before ReportController@store.
 */
class StoreReportRequest extends FormRequest
{
    /**
     * Any authenticated user can submit a report.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for report submission.
     */
    public function rules(): array
    {
        return [
            'type' => 'required|in:lost,found',
            'item_name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'description' => 'required|string|max:2000',
            'location' => 'required|string|max:255',
            'campus' => 'required|in:arlegui,casal,outside',
            'date_occurrence' => 'nullable|date|before_or_equal:today',
            'contact_number' => 'nullable|string|max:20',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpg,jpeg,png|max:5120', // 5 MB each
        ];
    }

    /**
     * Human-readable attribute names for validation messages.
     */
    public function attributes(): array
    {
        return [
            'type' => 'report type',
            'item_name' => 'item name',
            'category' => 'category',
            'description' => 'description',
            'location' => 'location',
            'campus' => 'campus',
            'date_occurrence' => 'date of occurrence',
            'contact_number' => 'contact number',
            'images' => 'images',
            'images.*' => 'image file',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'type.in' => 'Report type must be either "lost" or "found".',
            'campus.required' => 'Please select a campus.',
            'campus.in' => 'Campus must be Arlegui, Casal, or Outside TIP.',
            'date_occurrence.before_or_equal' => 'Date of occurrence cannot be in the future.',
            'images.max' => 'You may upload a maximum of 5 images.',
            'images.*.mimes' => 'Each image must be a JPG, JPEG, or PNG file.',
            'images.*.max' => 'Each image must not exceed 5 MB.',
        ];
    }
}
