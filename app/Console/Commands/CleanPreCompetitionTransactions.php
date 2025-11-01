<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CleanPreCompetitionTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'competition:clean-pre-competition-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove all transactions dated BEFORE Nov 1, 2025 (competition start date) - No confirmation required';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $competitionStart = Carbon::parse('2025-11-01 00:00:00', 'Asia/Kuala_Lumpur');
        
        $this->info('🔍 Searching for transactions dated BEFORE Nov 1, 2025...');
        $this->newLine();
        
        // Get transactions BEFORE competition start (only transactions dated < Nov 1, 2025)
        $transactionsToDelete = Transaction::where('transaction_date', '<', $competitionStart)->get();
        
        if ($transactionsToDelete->isEmpty()) {
            $this->info('✓ No pre-competition transactions found to delete.');
            $this->info('  Database is clean and ready for competition!');
            return 0;
        }

        $count = $transactionsToDelete->count();
        $this->warn("⚠️  Found {$count} transaction(s) dated BEFORE Nov 1, 2025");
        $this->newLine();
        
        // Show summary by status
        $summary = $transactionsToDelete->groupBy('status')->map->count();
        $this->table(
            ['Status', 'Count'],
            $summary->map(fn($count, $status) => [
                ucfirst($status), 
                $count
            ])->toArray()
        );

        // Show affected users
        $affectedUsers = $transactionsToDelete->pluck('user_id')->unique()->count();
        $this->info("👤 This will affect {$affectedUsers} user(s).");
        $this->newLine();

        // Show date range of transactions being deleted
        $oldestDate = $transactionsToDelete->min('transaction_date');
        $newestDate = $transactionsToDelete->max('transaction_date');
        $this->comment("📅 Transaction date range: {$oldestDate->format('Y-m-d')} to {$newestDate->format('Y-m-d')}");
        $this->comment("✂️  All transactions dated BEFORE {$competitionStart->format('Y-m-d')} will be deleted.");
        $this->newLine();

        // Perform deletion immediately (no confirmation required)
        $this->info('🗑️  Starting deletion process...');
        $this->newLine();

        // Perform deletion in a transaction
        DB::beginTransaction();
        try {
            $deletedFiles = 0;
            $bar = $this->output->createProgressBar($count);
            $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% - Deleting receipts...');
            $bar->start();

            // Delete associated files first (keep storage clean)
            foreach ($transactionsToDelete as $transaction) {
                if ($transaction->receipt_image_path && Storage::exists($transaction->receipt_image_path)) {
                    Storage::delete($transaction->receipt_image_path);
                    $deletedFiles++;
                }
                $bar->advance();
            }
            
            $bar->finish();
            $this->newLine(2);

            // Delete only transactions dated BEFORE Nov 1, 2025
            $deleted = Transaction::where('transaction_date', '<', $competitionStart)->delete();
            
            DB::commit();
            
            $this->newLine();
            $this->info("✅ Successfully deleted {$deleted} pre-competition transaction(s).");
            $this->info("📁 Deleted {$deletedFiles} receipt file(s) from storage.");
            $this->newLine();
            $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->info("🏁 Competition database is now clean!");
            $this->info("📅 Competition starts: Nov 1, 2025 (Week 1: Nov 1-9)");
            $this->comment("✓ Only transactions dated BEFORE Nov 1, 2025 were removed");
            $this->comment("✓ Transactions dated Nov 1, 2025 and later are preserved");
            $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->newLine();
            
            return 0;
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->newLine(2);
            $this->error('❌ Error during deletion: ' . $e->getMessage());
            $this->error('   Transaction rolled back. No data was deleted.');
            return 1;
        }
    }
}
