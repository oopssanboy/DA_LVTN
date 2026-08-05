<?php

namespace App\Exports;

use App\Models\Question;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class QuestionsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        $query = Question::with(['subject', 'topic', 'choices', 'fillBlankAnswers']);
        
  
        if (auth()->check() && auth()->user()->role === 'teacher') {
            $query->where('teacher_id', auth()->id());
        }
        
        return $query->get();
    }

    public function headings(): array
    {
        return [
            'subject_code',
            'topic_name',
            'type',
            'difficulty',
            'content',
            'score',
            'choices',
            'answer'
        ];
    }

    public function map($question): array
    {
        $choicesStr = '';
        $answerStr = '';

        if ($question->type !== 'fill_blank') {
            $choices = [];
            $corrects = [];
            foreach ($question->choices as $c) {
                $choices[] = $c->choice_key . ':' . $c->choice_text;
                if ($c->is_correct) {
                    $corrects[] = $c->choice_key;
                }
            }
            $choicesStr = implode('; ', $choices);
            $answerStr = implode(',', $corrects);
        } else {
            $answers = [];
            foreach ($question->fillBlankAnswers as $a) {
                $answers[] = $a->accepted_text;
            }
            $answerStr = implode('|', $answers);
        }

        return [
            $question->subject->code ?? '',
            $question->topic->name ?? '',
            $question->type,
            $question->difficulty,
            strip_tags($question->content), 
            $question->score,
            $choicesStr,
            $answerStr
        ];
    }
}