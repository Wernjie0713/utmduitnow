<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entrepreneur_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneur_unit_id')->constrained()->onDelete('cascade');
            $table->string('reference_id')->unique();
            $table->date('transaction_date');
            $table->time('transaction_time');
            $table->decimal('amount', 10, 2);
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
            $table->index(['entrepreneur_unit_id', 'transaction_date'], 'ent_txn_unit_date_index');
            $table->index('generated_at', 'ent_txn_generated_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entrepreneur_transactions');
    }
};
