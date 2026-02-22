<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('entrepreneur_units', function (Blueprint $table) {
            $table->string('course_code')->nullable()->after('business_location');
            $table->string('section')->nullable()->after('course_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('entrepreneur_units', function (Blueprint $table) {
            $table->dropColumn(['course_code', 'section']);
        });
    }
};
