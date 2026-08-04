<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ChoiceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'key' => $this->choice_key,
            'text' => $this->choice_text,
            'is_correct' => (bool) $this->is_correct,
        ];
    }
}