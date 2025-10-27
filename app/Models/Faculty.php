<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    protected $fillable = [
        'full_name',
        'short_name',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
