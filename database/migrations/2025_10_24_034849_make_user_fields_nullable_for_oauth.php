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
        Schema::table('users', function (Blueprint $table) {
            // Make password nullable for OAuth users
            $table->string('password')->nullable()->change();
            
            // Make student fields nullable (will be filled during profile completion)
            $table->string('matric_no')->nullable()->change();
            $table->integer('year_of_study')->nullable()->change();
            $table->string('duitnow_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revert to non-nullable (with caution - may fail if null values exist)
            $table->string('password')->nullable(false)->change();
            $table->string('matric_no')->nullable(false)->change();
            $table->integer('year_of_study')->nullable(false)->change();
            $table->string('duitnow_id')->nullable(false)->change();
        });
    }
};
