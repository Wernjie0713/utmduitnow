<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsShop
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !($user->isA('shop') || $user->isAn('admin'))) {
            abort(403, 'Unauthorized. Access restricted to business units.');
        }

        return $next($request);
    }
}
