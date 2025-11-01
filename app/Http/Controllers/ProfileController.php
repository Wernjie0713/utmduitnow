<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Faculty;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $faculties = Faculty::all();
        $user = $request->user();
        
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'faculties' => $faculties,
            'showCompetitionAnnouncement' => $this->shouldShowCompetitionAnnouncement($user),
        ]);
    }

    /**
     * Check if the competition announcement modal should be shown
     * Only show to users who:
     * 1. Haven't seen it yet (has_seen_competition_announcement = false)
     * 2. Created their account before or on Nov 1, 2025 (were affected by the data cleanup)
     */
    private function shouldShowCompetitionAnnouncement($user): bool
    {
        // If user has already seen the announcement, don't show it
        if ($user->has_seen_competition_announcement) {
            return false;
        }

        // Only show to users created on or before Nov 1, 2025
        // New users after Nov 1 don't need to see this announcement
        $announcementCutoffDate = Carbon::parse('2025-11-01 23:59:59', 'Asia/Kuala_Lumpur');
        
        return $user->created_at->lte($announcementCutoffDate);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Update the user's avatar.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120'],
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar_url) {
            Storage::disk('public')->delete($user->avatar_url);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar_url = $path;
        $user->save();

        return Redirect::route('profile.edit')->with('status', 'avatar-updated');
    }

    /**
     * Delete the user's avatar.
     */
    public function destroyAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar_url) {
            Storage::disk('public')->delete($user->avatar_url);
            $user->avatar_url = null;
            $user->save();
        }

        return Redirect::route('profile.edit')->with('status', 'avatar-deleted');
    }

    /**
     * Update student information including phone number
     */
    public function updateStudent(Request $request): RedirectResponse
    {
        $rules = [
            'phone_number' => ['required', 'string', 'max:20'],
            'matric_no' => ['required', 'string', 'max:255', 'unique:users,matric_no,' . $request->user()->id],
            'faculty_id' => ['required', 'exists:faculties,id'],
            'year_of_study' => ['required', 'integer', 'min:1', 'max:4'],
            'duitnow_id' => ['required', 'string', 'max:255', 'unique:users,duitnow_id,' . $request->user()->id],
        ];

        // Add password validation if user doesn't have a password (OAuth users)
        if (!$request->user()->password) {
            $rules['password'] = ['required', 'confirmed', Rules\Password::defaults()];
        }

        $validated = $request->validate($rules);

        // Hash password if provided
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user = $request->user();
        
        Log::info('Updating student information', [
            'user_id' => $user->id,
            'validated_data' => array_diff_key($validated, ['password' => '', 'password_confirmation' => ''])
        ]);
        
        $user->update($validated);
        
        // Refresh user to get updated values
        $user->refresh();
        
        Log::info('User data after update', [
            'user_id' => $user->id,
            'phone_number' => $user->phone_number,
            'matric_no' => $user->matric_no,
            'faculty_id' => $user->faculty_id,
            'year_of_study' => $user->year_of_study,
            'duitnow_id' => $user->duitnow_id,
            'password' => $user->password ? 'set' : 'null',
            'profile_completed' => $user->profile_completed
        ]);
        
        // Check if profile is now complete
        $needsCompletion = $user->needsProfileCompletion();
        Log::info('Profile completion check', [
            'user_id' => $user->id,
            'needs_completion' => $needsCompletion,
            'profile_completed_before' => $user->profile_completed
        ]);
        
        if (!$needsCompletion) {
            $user->update(['profile_completed' => true]);
            $user->refresh();
            Log::info('Profile marked as complete', [
                'user_id' => $user->id,
                'profile_completed_after' => $user->profile_completed
            ]);
        } else {
            Log::warning('Profile still incomplete', [
                'user_id' => $user->id,
                'missing_fields' => [
                    'phone_number' => !$user->phone_number,
                    'password' => !$user->password,
                    'matric_no' => !$user->matric_no,
                    'faculty_id' => !$user->faculty_id,
                    'year_of_study' => !$user->year_of_study,
                    'duitnow_id' => !$user->duitnow_id,
                ]
            ]);
        }

        return Redirect::route('profile.edit')->with('status', 'student-information-updated');
    }

    /**
     * Update password (required for OAuth users)
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => $request->user()->password ? ['required', 'current_password'] : [],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);
        
        // Check if profile is now complete
        if (!$request->user()->needsProfileCompletion()) {
            $request->user()->update(['profile_completed' => true]);
        }

        return Redirect::route('profile.edit')->with('status', 'password-updated');
    }
}
