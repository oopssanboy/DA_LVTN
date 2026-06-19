<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ExamMatrixResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'topic_id' => $this->topic_id,
            'difficulty' => $this->difficulty,
            'quantity' => $this->quantity,
        ];
    }
}