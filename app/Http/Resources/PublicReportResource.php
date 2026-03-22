<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isSensitive = (bool) $this->is_sensitive;
        $formattedName = null;

        if ($isSensitive && !empty($this->name_on_item)) {
            $parts = explode(' ', trim($this->name_on_item));
            if (count($parts) > 1) {
                $firstName = array_shift($parts);
                $surname = implode(' ', $parts);
                $formattedName = strtoupper(substr($firstName, 0, 1)) . '. ' . $surname;
            } else {
                $formattedName = $this->name_on_item;
            }
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'item_name' => $this->item_name,
            'category' => $this->category,
            'campus' => $this->campus,
            'status' => $this->status,
            'is_sensitive' => $isSensitive,
            'name_on_item' => $isSensitive ? $formattedName : null,
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