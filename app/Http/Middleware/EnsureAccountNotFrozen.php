<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EnsureAccountNotFrozen
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response|InertiaResponse
    {
        $user = $request->user();
        
        // Check if user is frozen
        if ($user && $user->is_frozen) {
            // Allow logout route
            if ($request->routeIs('logout')) {
                return $next($request);
            }
            
            // Return frozen account page for all other routes
            return Inertia::render('Auth/AccountFrozen');
        }
        
        return $next($request);
    }
}



