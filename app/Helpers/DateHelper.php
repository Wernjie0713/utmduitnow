<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateHelper
{
    /**
     * Get the current date/time for the application
     * 
     * @param string|null $timezone
     * @return Carbon
     */
    public static function now(?string $timezone = 'Asia/Kuala_Lumpur'): Carbon
    {
        return Carbon::now($timezone);
    }
    
    /**
     * Get today's date as a string (Y-m-d format)
     * 
     * @return string
     */
    public static function today(): string
    {
        return self::now()->toDateString();
    }
}

