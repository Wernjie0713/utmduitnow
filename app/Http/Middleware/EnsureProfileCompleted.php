<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileCompleted
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Skip if on profile edit page or logout route
        if ($request->routeIs('profile.edit') || 
            $request->routeIs('profile.update') ||
            $request->routeIs('profile.update.student') ||
            $request->routeIs('profile.update.avatar') ||
            $request->routeIs('password.update') ||
            $request->routeIs('logout')) {
            return $next($request);
        }
        
        // Redirect if profile incomplete
        if ($user && $user->needsProfileCompletion()) {
            return redirect()->route('profile.edit')
                ->with('warning', 'Please complete your profile to access the dashboard.');
        }
        
        return $next($request);
    }
}

