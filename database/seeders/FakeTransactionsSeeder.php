<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use Carbon\Carbon;

class FakeTransactionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $userId = 2; // YONG WERN JIE
        
        // Sample reference ID patterns
        $tngPattern = function($day) {
            return '202510' . str_pad($day, 2, '0', STR_PAD_LEFT) . 'TNGDMYNB0300QR' . rand(10000000, 99999999);
        };
        
        $publicBankPattern = function() {
            return (string) rand(100000, 999999);
        };
        
        $maybankPattern = function($day) {
            return '202510' . str_pad($day, 2, '0', STR_PAD_LEFT) . 'PBBEMYKL010ORM' . rand(10000000, 99999999);
        };
        
        // Transaction types
        $transactionTypes = [
            'DuitNow Transfer',
            'DuitNow QR',
            'DuitNow Payment',
            'Transfer',
            'Payment',
        ];
        
        // Merchants for QR payments
        $merchants = [
            'ATLAS VENDING (M) SDN BHD',
            '7-ELEVEN MALAYSIA',
            'STARBUCKS MALAYSIA',
            'MCDONALD\'S MALAYSIA',
            'KFC HOLDINGS (M) BHD',
            'LOTUS\'S STORES (M) SDN BHD',
            'MYDIN MOHAMED HOLDINGS',
            'MR DIY GROUP (M) BHD',
            'POPULAR BOOK CO (M) SDN BHD',
            'GUARDIAN HEALTH AND BEAUTY',
        ];
        
        // Generate transactions for the past 10 days
        $baseDate = Carbon::now();
        
        $transactions = [];
        
        for ($day = 0; $day < 10; $day++) {
            $transactionDate = $baseDate->copy()->subDays($day);
            
            // 3-5 transactions per day
            $dailyCount = rand(3, 5);
            
            for ($i = 0; $i < $dailyCount; $i++) {
                // Random time during the day
                $hour = rand(8, 22);
                $minute = rand(0, 59);
                $second = rand(0, 59);
                $transactionTime = sprintf('%02d:%02d:%02d', $hour, $minute, $second);
                
                // Random amount between 0.50 and 150.00
                $amount = round(rand(50, 15000) / 100, 2);
                
                // Select transaction type
                $transactionType = $transactionTypes[array_rand($transactionTypes)];
                
                // Generate reference ID based on pattern
                if ($transactionType === 'DuitNow QR' || $transactionType === 'DuitNow Payment') {
                    $referenceId = $tngPattern($transactionDate->day);
                } elseif ($transactionType === 'DuitNow Transfer') {
                    // Mix of patterns
                    $referenceId = rand(0, 1) === 0 ? $publicBankPattern() : $maybankPattern($transactionDate->day);
                } else {
                    $referenceId = $publicBankPattern();
                }
                
                // Status distribution: 70% approved, 20% pending, 10% rejected
                $rand = rand(1, 100);
                if ($rand <= 70) {
                    $status = 'approved';
                    $rejectionReason = null;
                    $approvedAt = $transactionDate->copy()->addHours(rand(1, 3));
                } elseif ($rand <= 90) {
                    $status = 'pending';
                    $rejectionReason = null;
                    $approvedAt = null;
                } else {
                    $status = 'rejected';
                    $rejectionReasons = [
                        'Receipt image is blurry or unreadable.',
                        'Transaction date does not match the current week.',
                        'Duplicate transaction detected.',
                        'Receipt appears to be edited or manipulated.',
                        'Missing required information (date, time, amount, or reference ID).',
                        'Daily submission limit exceeded.',
                    ];
                    $rejectionReason = $rejectionReasons[array_rand($rejectionReasons)];
                    $approvedAt = null;
                }
                
                // Create OCR raw text simulation
                $merchant = $merchants[array_rand($merchants)];
                $ocrRawText = $this->generateOcrText($transactionType, $amount, $referenceId, $transactionDate, $transactionTime, $merchant);
                
                // Parsed data
                $parsedData = [
                    'date' => $transactionDate->format('Y-m-d'),
                    'time' => $transactionTime,
                    'amount' => $amount,
                    'reference_id' => $referenceId,
                    'transaction_type' => $transactionType,
                ];
                
                // Receipt image path (fake path)
                $receiptImagePath = 'receipts/receipt_' . $userId . '_' . time() . '_' . uniqid() . '.jpg';
                
                // Submitted at time
                $submittedAt = $transactionDate->copy()->addMinutes(rand(5, 30));
                
                $transactions[] = [
                    'user_id' => $userId,
                    'reference_id' => $referenceId,
                    'transaction_date' => $transactionDate->format('Y-m-d'),
                    'transaction_time' => $transactionTime,
                    'amount' => $amount,
                    'receipt_image_path' => $receiptImagePath,
                    'ocr_raw_text' => $ocrRawText,
                    'parsed_data' => json_encode($parsedData),
                    'status' => $status,
                    'rejection_reason' => $rejectionReason,
                    'submitted_at' => $submittedAt,
                    'approved_at' => $approvedAt,
                    'created_at' => $submittedAt,
                    'updated_at' => $approvedAt ?? $submittedAt,
                ];
            }
        }
        
        // Insert all transactions
        Transaction::insert($transactions);
        
        $this->command->info('Created ' . count($transactions) . ' fake transactions for testing.');
    }
    
    /**
     * Generate realistic OCR text based on transaction type
     */
    private function generateOcrText($type, $amount, $refId, $date, $time, $merchant)
    {
        $formattedAmount = 'RM ' . number_format($amount, 2);
        $formattedDate = $date->format('d/m/Y');
        
        if ($type === 'DuitNow QR' || $type === 'DuitNow Payment') {
            return "Details\n{$formattedAmount}\nTransaction Type\n{$type}\nMerchant\n{$merchant}\nPayment Method\neWallet Balance\nDate/Time\n{$formattedDate} {$time}\nStatus\nSuccessful\nTransaction No.\n{$refId}\nDuitNow Ref No.\n{$refId}";
        } elseif ($type === 'DuitNow Transfer') {
            return "{$formattedAmount}\nMoney Sent\nReference No.\n{$refId}\nDate & Time\n{$formattedDate} {$time}\nTransfer Method\n{$type}\nRecipient Bank\nTouch n Go eWallet\nRecipient Account\nJOHN DOE\n101164484656\nFrom Account\n****** 5007";
        } else {
            return "{$formattedAmount}\nMoney Sent\nReference No.\n{$refId}\nDate & Time\n{$formattedDate} {$time}\nTransfer Method\n{$type}";
        }
    }
}

