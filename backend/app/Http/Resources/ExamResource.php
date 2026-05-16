<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'class_id' => $this->class_id,
            'class_name' => $this->class->name ?? null,
            'title' => $this->title,
            'subject' => $this->subject,
            'duration' => $this->duration,
            'total_questions' => $this->total_questions,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'password' => $this->password,
            'is_active' => $this->is_active,
            'shuffle_questions' => $this->shuffle_questions,
            'shuffle_options' => $this->shuffle_options,
            'passing_score' => $this->passing_score,
            'matrices' => ExamMatrixResource::collection($this->whenLoaded('matrices')),
            'questions_count' => $this->questions->count(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}