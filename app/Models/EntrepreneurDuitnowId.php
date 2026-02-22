<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntrepreneurDuitnowId extends Model
{
    protected $fillable = [
        'entrepreneur_unit_id',
        'duitnow_id',
    ];

    public function entrepreneurUnit()
    {
        return $this->belongsTo(EntrepreneurUnit::class);
    }
}
