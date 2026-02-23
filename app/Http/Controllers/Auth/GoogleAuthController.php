<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback()
    {
        Log::info('Google OAuth callback initiated');

        try {
            $googleUser = Socialite::driver('google')->user();

            Log::info('Google user retrieved', [
                'email' => $googleUser->getEmail(),
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId()
            ]);

            // Check if user exists by email (link accounts)
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                Log::info('Existing user found, linking Google account', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'current_email_verified_at' => $user->email_verified_at
                ]);

                // Link Google account to existing user and verify email
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'email_verified_at' => now(),
                ]);

                $user->refresh();
                Log::info('User updated with Google ID and email verified', [
                    'user_id' => $user->id,
                    'google_id' => $user->google_id,
                    'email_verified_at' => $user->email_verified_at
                ]);
            } else {
                Log::info('New registration attempt from Google account blocked (event ended)', [
                    'email' => $googleUser->getEmail()
                ]);

                return redirect()->route('login')
                    ->withErrors(['google' => 'Registration is currently closed as the event has ended. Only existing users can log in.']);
            }

            // Download and store avatar (if user exists)
            if (isset($user) && $googleUser->getAvatar()) {
                $this->downloadAndStoreAvatar($user, $googleUser->getAvatar());
            }

            // Login the user
            Auth::login($user, true);
            Log::info('User logged in via Google OAuth', ['user_id' => $user->id]);

            // Check profile completion status
            $needsCompletion = $user->needsProfileCompletion();
            Log::info('Profile completion check', [
                'user_id' => $user->id,
                'needs_completion' => $needsCompletion,
                'profile_completed' => $user->profile_completed,
                'phone_number' => $user->phone_number ? 'set' : 'null',
                'password' => $user->password ? 'set' : 'null',
                'matric_no' => $user->matric_no ? 'set' : 'null',
                'faculty_id' => $user->faculty_id ? 'set' : 'null',
                'year_of_study' => $user->year_of_study ? 'set' : 'null',
                'duitnow_id' => $user->duitnow_id ? 'set' : 'null',
            ]);

            // Redirect based on profile completion
            if ($needsCompletion) {
                Log::info('Redirecting to profile edit page');
                return redirect()->route('profile.edit')
                    ->with('status', 'Please complete your profile to continue.');
            }

            Log::info('Redirecting to dashboard');
            return redirect()->intended(route('dashboard'));
        } catch (Exception $e) {
            Log::error('Google OAuth failed: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('login')
                ->withErrors(['google' => 'Google authentication failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Download Google avatar and store locally
     */
    protected function downloadAndStoreAvatar(User $user, string $avatarUrl)
    {
        try {
            // Download image from Google
            $imageContent = file_get_contents($avatarUrl);

            if ($imageContent === false) {
                return;
            }

            // Generate unique filename
            $filename = 'avatars/' . $user->id . '_' . Str::random(10) . '.jpg';

            // Store in public disk (same as UpdateAvatarForm)
            Storage::disk('public')->put($filename, $imageContent);

            // Update user avatar_url
            $user->update(['avatar_url' => $filename]);
        } catch (Exception $e) {
            // Log error but don't fail the registration
            Log::error('Failed to download Google avatar: ' . $e->getMessage());
        }
    }
}
