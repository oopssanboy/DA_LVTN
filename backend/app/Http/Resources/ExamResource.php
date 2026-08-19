<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'classes' => $this->whenLoaded('classes'),
            'proctors' => $this->whenLoaded('proctors'),
            'teacher_id' => $this->teacher_id,
            'teacher_name' => $this->teacher->name ?? ($this->teacher->email ?? 'N/A'),
            'title' => $this->title,
            'subject_name' => $this->subject->name ?? '',
            'subject' => $this->subject,
            'duration' => $this->duration,
            'total_questions' => $this->total_questions,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'password' => $this->password,
            'is_active' => (bool) $this->is_active,
            'show_answers' => (bool) $this->show_answers,
            'is_practice' => (bool) $this->is_practice,
            'shuffle_questions' => (bool) $this->shuffle_questions,
            'shuffle_options' => (bool) $this->shuffle_options,
            'passing_score' => $this->passing_score,
            'scoring_method' => $this->scoring_method,
            'attempts_count' => $this->attempts_count ?? $this->attempts()->count(),
            'matrices' => ExamMatrixResource::collection($this->whenLoaded('matrices')),
            'questions' => $this->whenLoaded('questions'),
            'questions_count' => $this->questions->count(),
            'in_progress_count' => $this->in_progress_count ?? 0,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}