<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreClaimRequest
 *
 * Validates data for submitting a claim on a report.
 * Users must provide a description of proof of ownership.
 */
class StoreClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'direction' => 'nullable|in:owner_claiming_found,finder_reporting_found',
            'proof_description' => 'required_unless:direction,finder_reporting_found|nullable|string|max:2000',
            'finder_message' => 'required_if:direction,finder_reporting_found|nullable|string|max:500',
        ];
    }

    public function attributes(): array
    {
        return [
            'proof_description' => 'proof of ownership',
        ];
    }

    public function messages(): array
    {
        return [
            'proof_description.required' => 'Please describe how you can prove this item is yours.',
            'proof_description.max' => 'Proof description must not exceed 2000 characters.',
        ];
    }
}
