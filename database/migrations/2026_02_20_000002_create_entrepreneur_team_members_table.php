<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entrepreneur_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneur_unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->unique(['entrepreneur_unit_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entrepreneur_team_members');
    }
};
