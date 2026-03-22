<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'item_name' => $this->item_name,
            'category' => $this->category,
            'campus' => $this->campus,
            'status' => $this->status,
            'date_occurrence' => $this->date_occurrence,
            'created_at' => $this->created_at,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'images' => $this->category === 'Documents'
            ? []
            : $this->whenLoaded('images', function () {
            return $this->images->map(fn($img) => [
            'id' => $img->id,
            'url' => $img->image_url,
            ]);
        }),
        ];
    }
}