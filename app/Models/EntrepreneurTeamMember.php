<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntrepreneurTeamMember extends Model
{
    protected $fillable = [
        'entrepreneur_unit_id',
        'member_name',
        'matric_no',
    ];

    public function entrepreneurUnit()
    {
        return $this->belongsTo(EntrepreneurUnit::class);
    }
}
