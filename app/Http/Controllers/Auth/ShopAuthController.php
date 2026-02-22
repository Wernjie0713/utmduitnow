<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\EntrepreneurUnit;
use App\Models\EntrepreneurTeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class ShopAuthController extends Controller
{
    public function showRegisterForm()
    {
        return Inertia::render('Auth/ShopRegister');
    }

    public function register(Request $request)
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'business_location' => 'required|in:online,physical',
            'course_code' => 'required|string|max:255',
            'section' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'team_members' => 'nullable|array',
            'team_members.*.name' => 'required|string|max:255',
            'team_members.*.matric_no' => 'required|string|max:255',
            'duitnow_ids' => 'required|array|min:1',
            'duitnow_ids.*' => 'required|string|max:255',
        ]);

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->business_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'profile_completed' => true,
                'email_verified_at' => now(),
            ]);

            $user->assign('shop');

            $unit = EntrepreneurUnit::create([
                'business_name' => $request->business_name,
                'business_location' => $request->business_location,
                'course_code' => $request->course_code,
                'section' => $request->section,
                'manager_id' => $user->id,
            ]);

            if ($request->team_members) {
                foreach ($request->team_members as $member) {
                    $unit->teamMembers()->create([
                        'member_name' => $member['name'],
                        'matric_no' => $member['matric_no'],
                    ]);
                }
            }

            if ($request->duitnow_ids) {
                foreach ($request->duitnow_ids as $duitnowId) {
                    $unit->duitnowIds()->create(['duitnow_id' => $duitnowId]);
                }
            }

            return $user;
        });

        Auth::login($user);

        return redirect()->route('shop.profile');
    }
}
