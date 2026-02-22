<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // Load roles and entrepreneur unit relationships if user exists
        if ($user) {
            $user->load('roles');
            $user->loadMissing('entrepreneurUnit');
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    ...$user->toArray(),
                    'needsProfileCompletion' => $user->needsProfileCompletion(),
                    'password' => $user->password ? true : false, // Only send boolean
                    'entrepreneurUnit' => $user->isA('shop') ? $user->entrepreneurUnit?->load('teamMembers', 'duitnowIds') : null,
                ] : null,
            ],
            'isShop' => $user ? $user->isA('shop') : false,
        ];
    }
}
