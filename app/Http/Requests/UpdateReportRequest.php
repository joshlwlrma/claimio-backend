<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateReportRequest
 *
 * Validates incoming data for updating an existing report.
 * Only the report owner can update. All fields are optional (partial update).
 */
class UpdateReportRequest extends FormRequest
{
    /**
     * Only the report owner can update it.
     */
    public function authorize(): bool
    {
        return $this->user()->id === $this->route('report')->user_id;
    }

    /**
     * Validation rules — same as store but all fields are optional.
     */
    public function rules(): array
    {
        return [
            'type' => 'sometimes|in:lost,found',
            'item_name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:100',
            'description' => 'sometimes|string|max:2000',
            'location' => 'sometimes|string|max:255',
            'date_occurrence' => 'sometimes|date|before_or_equal:today',
            'contact_number' => 'nullable|string|max:20',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpg,jpeg,png|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'type.in' => 'Report type must be either "lost" or "found".',
            'date_occurrence.before_or_equal' => 'Date of occurrence cannot be in the future.',
            'images.max' => 'You may upload a maximum of 5 images.',
            'images.*.mimes' => 'Each image must be a JPG, JPEG, or PNG file.',
            'images.*.max' => 'Each image must not exceed 5 MB.',
        ];
    }
}
