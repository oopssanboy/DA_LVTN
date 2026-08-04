<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'subject_id' => $this->subject_id, 
            'topic_id' => $this->topic_id,
            'subject' => $this->subject,
            'topic' => $this->topic,
            'content' => $this->content,
            'type' => $this->type,
            'difficulty' => $this->difficulty,
            'correct_answer' => $this->correct_answer,
            'score' => $this->score,
            'explanation' => $this->explanation,
            'choices' => ChoiceResource::collection($this->whenLoaded('choices')),
            'fill_blank_answers' => $this->whenLoaded('fillBlankAnswers'),
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}