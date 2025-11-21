<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Check if user is authenticated
        if (!$user) {
            return redirect()->route('login');
        }
        
        // Ensure roles are loaded for Bouncer
        $user->load('roles');
        
        // Check if user is an admin
        if (!$user->isAn('admin')) {
            abort(403, 'Unauthorized access. Admin privileges required.');
        }
        
        return $next($request);
    }
}

