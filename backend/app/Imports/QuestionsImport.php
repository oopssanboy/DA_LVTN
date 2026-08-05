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
use Exception;

class QuestionsImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        return DB::transaction(function () use ($row) {
            if (empty($row['subject_code']) && empty($row['topic_name']) && empty($row['content'])) {
                return null;
            }

       
            $subjectCode = trim($row['subject_code'] ?? '');
            $subject = Subject::where('code', $subjectCode)->first();
            if (!$subject) {
        
                throw new Exception("Lỗi: Mã môn học '{$subjectCode}' không tồn tại trong hệ thống. Vui lòng kiểm tra lại file Excel.");
            }

            $topicName = trim($row['topic_name'] ?? '');
            $topic = Topic::where('name', $topicName)
                          ->where('subject_id', $subject->id) 
                          ->first();
            if (!$topic) {
                throw new Exception("Lỗi: Chủ đề '{$topicName}' không tồn tại hoặc không thuộc môn '{$subject->name}'.");
            }

            $content = trim($row['content'] ?? '');
            if (empty($content)) {
                 throw new Exception("Lỗi: Nội dung câu hỏi không được để trống.");
            }

            $teacherId = auth()->check() && auth()->user()->role === 'teacher' ? auth()->id() : null;

       
            $isDuplicate = Question::where('content', $content)
                ->where('subject_id', $subject->id)
                ->where('topic_id', $topic->id)
                ->when($teacherId, function ($query, $teacherId) {
                    return $query->where('teacher_id', $teacherId);
                })
                ->exists();

            if ($isDuplicate) {
                return null;
            }

            $question = Question::create([
                'teacher_id' => $teacherId,
                'subject_id' => $subject->id,
                'topic_id' => $topic->id,
                'type' => $row['type'] ?? 'single',
                'difficulty' => $row['difficulty'] ?? 'medium',
                'content' => $content,
                'score' => $row['score'] ?? 1.0,
            ]);

            if ($question->type !== 'fill_blank') {
                $choicesStr = $row['choices'] ?? '';
                $answersArr = explode(',', str_replace(' ', '', $row['answer'] ?? ''));

                $choicePairs = array_filter(explode(';', $choicesStr));
                foreach ($choicePairs as $pair) {
                    $parts = explode(':', $pair, 2);
                    if (count($parts) == 2) {
                        $key = trim($parts[0]);
                        $text = trim($parts[1]);
                        Choice::create([
                            'question_id' => $question->id,
                            'choice_key' => $key,
                            'choice_text' => $text,
                            'is_correct' => in_array($key, $answersArr)
                        ]);
                    }
                }
            } else {
                $answersArr = array_filter(explode('|', $row['answer'] ?? ''));
                foreach ($answersArr as $ans) {
                    FillBlankAnswer::create([
                        'question_id' => $question->id,
                        'accepted_text' => trim($ans)
                    ]);
                }
            }

            return $question;
        });
    }
}