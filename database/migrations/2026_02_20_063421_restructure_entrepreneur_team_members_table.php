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
        Schema::dropIfExists('entrepreneur_team_members');

        Schema::create('entrepreneur_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneur_unit_id')->constrained()->cascadeOnDelete();
            $table->string('member_name');
            $table->string('matric_no');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entrepreneur_team_members');

        Schema::create('entrepreneur_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneur_unit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            // Re-adding unique constraint if it existed
            $table->unique(['entrepreneur_unit_id', 'user_id']);
        });
    }
};
