<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntrepreneurUnit extends Model
{
    protected $fillable = [
        'business_name',
        'business_location',
        'course_code',
        'section',
        'manager_id',
    ];

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function teamMembers()
    {
        return $this->hasMany(EntrepreneurTeamMember::class);
    }

    public function duitnowIds()
    {
        return $this->hasMany(EntrepreneurDuitnowId::class);
    }

    public function transactions()
    {
        return $this->hasMany(EntrepreneurTransaction::class);
    }

    public function getTeamSizeAttribute()
    {
        return $this->teamMembers()->count() + 1; // +1 for manager
    }
}
