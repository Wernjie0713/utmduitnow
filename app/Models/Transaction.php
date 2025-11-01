<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Helpers\CompetitionWeekHelper;
use Carbon\Carbon;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'reference_id',
        'transaction_date',
        'transaction_time',
        'amount',
        'receipt_image_path',
        'ocr_raw_text',
        'parsed_data',
        'status',
        'rejection_reason',
        'submitted_at',
        'approved_at',
    ];

    protected $casts = [
        'parsed_data' => 'array',
        'transaction_date' => 'date',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeApproved(Builder $query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeThisWeek(Builder $query)
    {
        $boundaries = CompetitionWeekHelper::getCurrentWeekBoundaries();
        
        if ($boundaries === null) {
            // Competition hasn't started, return no results
            return $query->whereRaw('1 = 0');
        }
        
        return $query->whereBetween('approved_at', [$boundaries['start'], $boundaries['end']]);
    }

    public function scopeThisMonth(Builder $query)
    {
        return $query->whereMonth('approved_at', Carbon::now()->month)
                     ->whereYear('approved_at', Carbon::now()->year);
    }

    public function scopeForLeaderboard(Builder $query, $period, $month = null, $year = null)
    {
        $query->approved();
        
        switch ($period) {
            case 'weekly':
                return $query->thisWeek();
            case 'monthly':
                $month = $month ?? Carbon::now()->month;
                $year = $year ?? Carbon::now()->year;
                return $query->whereMonth('approved_at', $month)
                             ->whereYear('approved_at', $year);
            case 'all_time':
            default:
                return $query;
        }
    }
}
