<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\EntrepreneurUnitController;
use App\Http\Controllers\EntrepreneurLeaderboardController;
use App\Http\Controllers\Admin\EntrepreneurDataController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'profile.completed', 'account.not.frozen'])
    ->name('dashboard');

Route::middleware(['auth', 'account.not.frozen'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Avatar routes
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');

    // Student information update
    Route::patch('/profile/student', [ProfileController::class, 'updateStudent'])->name('profile.update.student');

    // Competition announcement acknowledgment
    Route::post('/competition/acknowledge-announcement', [DashboardController::class, 'acknowledgeAnnouncement'])->name('competition.acknowledge-announcement');
});

// Student Routes (Authenticated)
Route::middleware(['auth', 'verified', 'profile.completed', 'account.not.frozen'])->group(function () {
    // Route::get('/transactions/submit', [TransactionController::class, 'index'])->name('transactions.submit');
    Route::post('/transactions/preview', [TransactionController::class, 'preview'])->name('transactions.preview');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::get('/transactions/my', [TransactionController::class, 'myTransactions'])->name('transactions.my');
    Route::get('/transactions/{id}', [TransactionController::class, 'show'])->name('transactions.show');

    // Leaderboard Routes
    Route::get('/leaderboard/full', [LeaderboardController::class, 'fullRankingsPage'])->name('leaderboard.full');
    Route::get('/api/leaderboard/full', [LeaderboardController::class, 'fullRankings'])->name('api.leaderboard.full');
    Route::get('/leaderboard/export', [LeaderboardController::class, 'exportFullRankings'])->name('leaderboard.export');
});

// Admin Routes
Route::middleware(['auth', 'verified', 'profile.completed', 'account.not.frozen', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/custom-range', [AdminDashboardController::class, 'getCustomRangeData'])->name('dashboard.custom');
    Route::get('/dashboard/period-data', [AdminDashboardController::class, 'getPeriodData'])->name('dashboard.period');
    Route::get('/users', [AdminDashboardController::class, 'users'])->name('users');
    Route::get('/users/export', [AdminDashboardController::class, 'exportUsers'])->name('users.export');
    Route::get('/reports', [AdminDashboardController::class, 'reports'])->name('reports');
    Route::get('/export', [AdminDashboardController::class, 'exportLeaderboard'])->name('export');

    // Entrepreneur Data Management
    Route::get('/entrepreneur/units', [EntrepreneurDataController::class, 'viewUnits'])->name('entrepreneur.units');
    Route::get('/entrepreneur/units/export', [EntrepreneurDataController::class, 'exportUnits'])->name('entrepreneur.units.export');
});

use App\Http\Controllers\Auth\ShopAuthController;

Route::middleware('guest')->group(function () {
    Route::get('/shop/register', [ShopAuthController::class, 'showRegisterForm'])->name('shop.register');
    Route::post('/shop/register', [ShopAuthController::class, 'register'])->name('shop.register.store');
});

// Shop Management (Requires shop role)
Route::middleware(['auth', 'verified', 'shop'])
    ->prefix('shop')->name('shop.')->group(function () {
        Route::get('/profile', [EntrepreneurUnitController::class, 'edit'])->name('profile');
        Route::put('/profile', [EntrepreneurUnitController::class, 'update'])->name('update');
        Route::post('/team', [EntrepreneurUnitController::class, 'addTeamMember'])->name('team.add');
        Route::delete('/team/{id}', [EntrepreneurUnitController::class, 'removeTeamMember'])->name('team.remove');
        Route::post('/duitnow', [EntrepreneurUnitController::class, 'addDuitnowId'])->name('duitnow.add');
        Route::delete('/duitnow/{id}', [EntrepreneurUnitController::class, 'removeDuitnowId'])->name('duitnow.remove');

        // Entrepreneur Leaderboard
        Route::get('/leaderboard', [EntrepreneurLeaderboardController::class, 'index'])->name('leaderboard');
        Route::get('/leaderboard/full/export', [EntrepreneurLeaderboardController::class, 'exportFullRankings'])->name('leaderboard.full.export');
        Route::get('/leaderboard/full', [EntrepreneurLeaderboardController::class, 'fullRankingsPage'])->name('leaderboard.full');
        Route::get('/api/leaderboard/full', [EntrepreneurLeaderboardController::class, 'fullRankings'])->name('api.leaderboard.full');
    });

require __DIR__ . '/auth.php';
