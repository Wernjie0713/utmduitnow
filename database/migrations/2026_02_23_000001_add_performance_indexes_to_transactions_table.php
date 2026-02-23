<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['status', 'approved_at'], 'idx_status_approved_at');
            $table->index(['status', 'created_at'], 'idx_status_created_at');
            $table->index('transaction_date', 'idx_transaction_date');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_status_approved_at');
            $table->dropIndex('idx_status_created_at');
            $table->dropIndex('idx_transaction_date');
        });
    }
};
