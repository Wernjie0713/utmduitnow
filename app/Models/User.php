<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Silber\Bouncer\Database\HasRolesAndAbilities;
use App\Helpers\DateHelper;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRolesAndAbilities;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'phone_number',
        'matric_no',
        'faculty_id',
        'year_of_study',
        'duitnow_id',
        'avatar_url',
        'google_id',
        'profile_completed',
        'has_seen_competition_announcement',
        'is_suspicious',
        'is_frozen',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_suspicious' => 'boolean',
            'is_frozen' => 'boolean',
        ];
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function entrepreneurUnit()
    {
        return $this->hasOne(EntrepreneurUnit::class, 'manager_id');
    }



    public function canSubmitToday()
    {
        $today = DateHelper::today();
        $maxSubmissions = config('app.max_submissions_per_day', 100);

        $todaySubmissions = DB::table('daily_submission_limits')
            ->where('user_id', $this->id)
            ->where('date', $today)
            ->value('submission_count') ?? 0;

        return $todaySubmissions < $maxSubmissions;
    }

    public function getTodaySubmissionCount()
    {
        $today = DateHelper::today();

        return DB::table('daily_submission_limits')
            ->where('user_id', $this->id)
            ->where('date', $today)
            ->value('submission_count') ?? 0;
    }

    /**
     * Get the user's avatar URL
     */
    public function getAvatarAttribute()
    {
        return $this->avatar_url ? Storage::url($this->avatar_url) : null;
    }

    /**
     * Get avatar with fallback
     */
    public function getAvatarUrlWithFallbackAttribute()
    {
        return $this->avatar ?: null;
    }

    /**
     * Set the user's name to uppercase
     */
    public function setNameAttribute($value)
    {
        $this->attributes['name'] = strtoupper($value);
    }

    /**
     * Set the matric_no to uppercase
     */
    public function setMatricNoAttribute($value)
    {
        $this->attributes['matric_no'] = strtoupper($value);
    }

    /**
     * Check if user needs to complete profile
     * Only checks if required fields are missing, not the profile_completed flag
     */
    public function needsProfileCompletion(): bool
    {
        return !$this->phone_number ||
            !$this->password ||
            !$this->matric_no ||
            !$this->faculty_id ||
            !$this->year_of_study ||
            !$this->duitnow_id;
    }
}
