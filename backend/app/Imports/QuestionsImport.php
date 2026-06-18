<?php

namespace App\Imports;

use App\Models\Question;
use App\Models\Choice;
use App\Models\FillBlankAnswer;
use App\Models\Subject;
use App\Models\Topic;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\DB;

class QuestionsImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        return DB::transaction(function () use ($row) {
            $subject = Subject::where('code', $row['subject_code'])->first();
            $topic = Topic::where('name', $row['topic_name'])->first();

            $question = Question::create([
                'subject_id' => $subject->id ?? 1,
                'topic_id' => $topic->id ?? 1,
                'type' => $row['type'],
                'difficulty' => $row['difficulty'],
                'content' => $row['content'],
                'score' => $row['score'],
                'correct_answer' => $row['answer'] // Lưu đáp án vào cột chính để dễ xử lý
            ]);

            if ($row['type'] !== 'fill_blank') {
                $choices = explode(';', $row['choices']);
                $answers = explode(',', $row['answer']); // VD: A,C
                
                foreach ($choices as $c) {
                    $parts = explode(':', $c); // A:Nội dung
                    Choice::create([
                        'question_id' => $question->id,
                        'choice_key' => $parts[0],
                        'choice_text' => $parts[1],
                        'is_correct' => in_array($parts[0], $answers)
                    ]);
                }
            } else {
                $answers = explode('|', $row['answer']);
                foreach ($answers as $ans) {
                    FillBlankAnswer::create([
                        'question_id' => $question->id,
                        'accepted_text' => $ans
                    ]);
                }
            }
            return $question;
        });
    }
}