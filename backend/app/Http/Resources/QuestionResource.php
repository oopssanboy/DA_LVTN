<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'topic' => $this->topic,
            'content' => $this->content,
            'type' => $this->type,
            'difficulty' => $this->difficulty,
            'correct_answer' => $this->correct_answer,
            'score' => $this->score,
            'explanation' => $this->explanation,
            'choices' => ChoiceResource::collection($this->whenLoaded('choices')),
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}