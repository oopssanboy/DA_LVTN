<?php

namespace App\Policies;

use App\Models\ExamAttempt;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ExamAttemptPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ExamAttempt $examAttempt): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ExamAttempt $attempt)
    {
        return $user->id === $attempt->student_id && $attempt->status === 'in_progress';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ExamAttempt $examAttempt): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ExamAttempt $examAttempt): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ExamAttempt $examAttempt): bool
    {
        return false;
    }
}
