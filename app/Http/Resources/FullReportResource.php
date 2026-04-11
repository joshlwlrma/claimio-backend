<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FullReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'item_name' => $this->item_name,
            'category' => $this->category,
            'description' => $this->description,
            'location' => $this->location,
            'campus' => $this->campus,
            'contact_number' => $this->contact_number,
            'status' => $this->status,
            'is_sensitive' => (bool) $this->is_sensitive,
            'name_on_item' => $this->name_on_item,
            'date_occurrence' => $this->date_occurrence,
            'resolved_at' => $this->resolved_at,
            'is_archived' => (bool) $this->is_archived,
            'created_at' => $this->created_at,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'avatar' => $this->user->avatar,
            ],
            'images' => $this->whenLoaded('images', function () {
                return $this->images->map(fn($img) => [
                    'id' => $img->id,
                    'url' => $img->image_url,
                ]);
            }),
            'claims' => $this->whenLoaded('claims', function () {
                return $this->claims->map(fn($claim) => [
                    'id' => $claim->id,
                    'claim_status' => $claim->claim_status,
                    'proof_description' => $claim->proof_description,
                    'direction' => $claim->direction,
                    'finder_message' => $claim->finder_message,
                    'created_at' => $claim->created_at,
                    'user' => [
                        'id' => $claim->user->id,
                        'name' => $claim->user->name,
                        'email' => $claim->user->email,
                    ],
                ]);
            }),
        ];
    }
}