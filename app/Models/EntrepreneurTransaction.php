<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class EntrepreneurTransaction extends Model
{
    protected $fillable = [
        'entrepreneur_unit_id',
        'reference_id',
        'transaction_date',
        'transaction_time',
        'amount',
        'generated_at',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'generated_at' => 'datetime',
    ];

    public function entrepreneurUnit()
    {
        return $this->belongsTo(EntrepreneurUnit::class);
    }

    public function scopeThisWeek(Builder $query)
    {
        $start = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $end = Carbon::now()->endOfWeek(Carbon::SUNDAY);

        return $query->whereBetween('transaction_date', [$start->toDateString(), $end->toDateString()]);
    }

    public function scopeThisMonth(Builder $query)
    {
        return $query->whereMonth('transaction_date', Carbon::now()->month)
                     ->whereYear('transaction_date', Carbon::now()->year);
    }
}
