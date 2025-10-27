<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Faculty;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Silber\Bouncer\BouncerFacade as Bouncer;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        $faculties = Faculty::all();
        
        return Inertia::render('Auth/Register', [
            'faculties' => $faculties,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone_number' => 'required|string|max:20',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'matric_no' => 'required|string|max:255|unique:users,matric_no',
            'faculty_id' => 'required|exists:faculties,id',
            'year_of_study' => 'required|integer|min:1|max:4',
            'duitnow_id' => 'required|string|max:255|unique:users,duitnow_id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'matric_no' => $request->matric_no,
            'faculty_id' => $request->faculty_id,
            'year_of_study' => $request->year_of_study,
            'duitnow_id' => $request->duitnow_id,
            'profile_completed' => true, // All required fields are provided during registration
        ]);

        // Assign student role
        Bouncer::assign('student')->to($user);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
