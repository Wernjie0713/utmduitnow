<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OctoberTransactionsSeeder extends Seeder
{
    /**
     * Seed demo transactions for October 2025
     * 
     * Data Patterns from Real Data (1758 transactions):
     * - User Distribution: Top users (6, 10, 19, 12, 21, 36) have 180-292 transactions each
     * - Amount Distribution: 53% are 0-5 RM, 32% are 10-20 RM, 9% negative (refunds), rest scattered
     * - Reference ID Formats: Multiple formats (RHBBMYKL, TNGDMYNB, P-prefixed, numeric with M suffix)
     * - All transactions are 'approved' status
     * 
     * This seeder generates 7032 transactions (1758 * 4) for October 2025
     */
    public function run(): void
    {
        // User distribution based on real data (user_id => percentage of total)
        $userDistribution = [
            6  => 16.6,  // 292/1758
            10 => 13.1,  // 230/1758
            19 => 12.2,  // 214/1758
            12 => 11.7,  // 205/1758
            21 => 10.6,  // 187/1758
            36 => 10.4,  // 183/1758
            18 => 5.7,   // 101/1758
            46 => 5.7,   // 100/1758
            17 => 4.3,   // 75/1758
            7  => 3.9,   // 68/1758
            4  => 1.4,   // 25/1758
            39 => 0.6,   // 11/1758
            27 => 0.5,   // 9/1758
            31 => 0.5,   // 8/1758
            47 => 0.5,   // 8/1758
            24 => 0.3,   // 6/1758
            37 => 0.3,   // 6/1758
            25 => 0.3,   // 5/1758
            23 => 0.2,   // 4/1758
            26 => 0.2,   // 4/1758
            28 => 0.2,   // 4/1758
            29 => 0.2,   // 4/1758
            13 => 0.1,   // 2/1758
            14 => 0.1,   // 2/1758
            34 => 0.1,   // 1/1758
            35 => 0.1,   // 1/1758
            38 => 0.1,   // 1/1758
            40 => 0.1,   // 1/1758
            41 => 0.1,   // 1/1758
        ];

        $totalTransactions = 7032; // 1758 * 4
        $batchSize = 500;
        $transactions = [];
        
        // Keep track of used reference IDs and receipt paths to prevent duplicates
        $usedReferenceIds = collect();
        $usedReceiptPaths = collect();
        
        echo "Starting to generate {$totalTransactions} transactions for October 2025...\n";
        
        for ($i = 0; $i < $totalTransactions; $i++) {
            // Select user based on distribution
            $userId = $this->selectUserByDistribution($userDistribution);
            
            // Generate random date/time in October 2025
            $transactionDateTime = $this->generateOctoberDateTime();
            
            // Generate amount based on real distribution
            $amount = $this->generateRealisticAmount();
            
            // Generate unique reference ID
            $referenceId = $this->generateUniqueReferenceId($usedReferenceIds, $transactionDateTime);
            $usedReferenceIds->push($referenceId);
            
            // Generate unique receipt path
            $receiptPath = $this->generateUniqueReceiptPath($userId, $usedReceiptPaths, $transactionDateTime);
            $usedReceiptPaths->push($receiptPath);
            
            // Generate OCR-like text
            $ocrText = $this->generateOcrText($referenceId, $transactionDateTime, $amount);
            
            // Generate parsed data JSON
            $parsedData = $this->generateParsedData($referenceId, $transactionDateTime, $amount);
            
            $transactions[] = [
                'user_id' => $userId,
                'reference_id' => $referenceId,
                'transaction_date' => $transactionDateTime->format('Y-m-d'),
                'transaction_time' => $transactionDateTime->format('H:i:s'),
                'amount' => $amount,
                'receipt_image_path' => $receiptPath,
                'ocr_raw_text' => $ocrText,
                'parsed_data' => $parsedData,
                'status' => 'approved',
                'rejection_reason' => null,
                'submitted_at' => $transactionDateTime->copy()->addMinutes(rand(1, 5)),
                'approved_at' => $transactionDateTime->copy()->addMinutes(rand(6, 15)),
                'created_at' => $transactionDateTime->copy()->addMinutes(rand(1, 5)),
                'updated_at' => $transactionDateTime->copy()->addMinutes(rand(6, 15)),
            ];
            
            // Insert in batches for better performance
            if (count($transactions) >= $batchSize) {
                DB::table('transactions')->insert($transactions);
                echo "Inserted batch: " . ($i + 1) . " / {$totalTransactions}\n";
                $transactions = [];
            }
        }
        
        // Insert remaining transactions
        if (count($transactions) > 0) {
            DB::table('transactions')->insert($transactions);
            echo "Inserted final batch: {$totalTransactions} / {$totalTransactions}\n";
        }
        
        echo "✅ Successfully seeded {$totalTransactions} October 2025 transactions!\n";
    }
    
    /**
     * Select user ID based on distribution percentages
     */
    private function selectUserByDistribution(array $distribution): int
    {
        $random = mt_rand(1, 1000) / 10; // Random 0.0 to 100.0
        
        $cumulative = 0;
        foreach ($distribution as $userId => $percentage) {
            $cumulative += $percentage;
            if ($random <= $cumulative) {
                return $userId;
            }
        }
        
        // Fallback to most common user
        return 6;
    }
    
    /**
     * Generate random datetime in October 2025
     */
    private function generateOctoberDateTime(): Carbon
    {
        // October 1-31, 2025
        $day = rand(1, 31);
        
        // Realistic time distribution (more transactions during day hours)
        $hour = $this->generateRealisticHour();
        $minute = rand(0, 59);
        $second = rand(0, 59);
        
        return Carbon::create(2025, 10, $day, $hour, $minute, $second);
    }
    
    /**
     * Generate realistic hour (weighted towards daytime 8am-10pm)
     */
    private function generateRealisticHour(): int
    {
        $random = rand(1, 100);
        
        if ($random <= 70) {
            // 70% chance: Peak hours 8am-10pm
            return rand(8, 22);
        } elseif ($random <= 90) {
            // 20% chance: Early/late hours 6am-8am or 10pm-midnight
            return rand(0, 100) > 50 ? rand(6, 7) : rand(22, 23);
        } else {
            // 10% chance: Night hours midnight-6am
            return rand(0, 5);
        }
    }
    
    /**
     * Generate amount based on real distribution
     * 53% are 0-5 RM, 32% are 10-20 RM, 9% negative (refunds), rest scattered
     */
    private function generateRealisticAmount(): string
    {
        $random = rand(1, 100);
        
        if ($random <= 53) {
            // 0-5 RM (53%)
            return number_format(mt_rand(50, 500) / 100, 2, '.', '');
        } elseif ($random <= 85) {
            // 10-20 RM (32%)
            return number_format(mt_rand(1000, 2000) / 100, 2, '.', '');
        } elseif ($random <= 94) {
            // Negative/refunds (9%)
            return '-' . number_format(mt_rand(100, 500) / 100, 2, '.', '');
        } elseif ($random <= 97) {
            // 5-10 RM (3%)
            return number_format(mt_rand(500, 1000) / 100, 2, '.', '');
        } elseif ($random <= 98) {
            // 20-50 RM (1%)
            return number_format(mt_rand(2000, 5000) / 100, 2, '.', '');
        } elseif ($random <= 99) {
            // 50-100 RM (1%)
            return number_format(mt_rand(5000, 10000) / 100, 2, '.', '');
        } else {
            // 100+ RM (1%)
            return number_format(mt_rand(10000, 121500) / 100, 2, '.', '');
        }
    }
    
    /**
     * Generate unique reference ID in various realistic formats
     */
    private function generateUniqueReferenceId($usedIds, Carbon $dateTime): string
    {
        $maxAttempts = 100;
        $attempt = 0;
        
        do {
            $format = rand(1, 8);
            
            $referenceId = match($format) {
                // Format 1: YYYYMMDDRHBBMYKL040QR + 8 random digits (30%)
                1 => $dateTime->format('Ymd') . 'RHBBMYKL040OQR' . $this->randomDigits(8),
                
                // Format 2: YYYYMMDDTNGDMYNB + variant + 8 digits (15%)
                2 => $dateTime->format('Ymd') . 'TNGDMYNB' . ['010ORM', '0300QR', '040OQR'][rand(0, 2)] . $this->randomDigits(8),
                
                // Format 3: P + YYMMDD + 9 digits (10%)
                3 => 'P' . $dateTime->format('ymd') . $this->randomDigits(9),
                
                // Format 4: 8 digits + M suffix (20%)
                4 => str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT) . 'M',
                
                // Format 5: Long numeric with TNGOW3MY (5%)
                5 => $dateTime->format('Ymd') . $this->randomDigits(10) . 'TNGOW3MY' . $this->randomDigits(12),
                
                // Format 6: YYYYMMDD + 20 digits (10%)
                6 => $dateTime->format('Ymd') . $this->randomDigits(20),
                
                // Format 7: 17 digits timestamp-like (5%)
                7 => (string)($dateTime->timestamp . $this->randomDigits(7)),
                
                // Format 8: Simple 6-digit (5%)
                8 => $this->randomDigits(6),
            };
            
            $attempt++;
            
            if ($attempt >= $maxAttempts) {
                // Fallback to guaranteed unique format
                $referenceId = 'DEMO' . $dateTime->format('YmdHis') . $this->randomDigits(6);
                break;
            }
            
        } while ($usedIds->contains($referenceId));
        
        return $referenceId;
    }
    
    /**
     * Generate unique receipt path
     */
    private function generateUniqueReceiptPath(int $userId, $usedPaths, Carbon $dateTime): string
    {
        $maxAttempts = 100;
        $attempt = 0;
        
        do {
            // Format: receipts/receipt_{userId}_{timestamp}_{random}.{ext}
            $timestamp = $dateTime->timestamp;
            $random = $this->randomHex(13);
            $extension = rand(1, 100) > 30 ? 'jpg' : 'png'; // 70% jpg, 30% png
            
            $path = "receipts/receipt_{$userId}_{$timestamp}_{$random}.{$extension}";
            
            $attempt++;
            
            if ($attempt >= $maxAttempts) {
                // Fallback with microseconds for uniqueness
                $path = "receipts/receipt_{$userId}_" . microtime(true) . "_{$random}.{$extension}";
                break;
            }
            
        } while ($usedPaths->contains($path));
        
        return $path;
    }
    
    /**
     * Generate realistic OCR text
     */
    private function generateOcrText(string $refId, Carbon $dateTime, string $amount): string
    {
        $templates = [
            // DuitNow QR style
            "Status\nSuccessful\n{$dateTime->format('h:i')}AM {$dateTime->format('l, j F Y')} MYT\nAmount\nMYR {$amount}\nDuitNow\nQR\nReference ID {$refId}\nFrom\nSavings Account\nTo\nMerchant Payment\nPayment Type\nDuitNow QR P2P\nShare Receipt",
            
            // DuitNow Transfer style
            "{$dateTime->format('H:i')}\nSuccessful\nRM {$amount}\n{$dateTime->format('j M Y, h:i A')}\nDuit Now\nPaid from\nMain Account\nReference ID\n{$refId}\nDone\nShare receipt",
            
            // Simple transfer style
            "Transaction Successful\n{$dateTime->format('d/m/Y')}\n{$dateTime->format('H:i:s')}\nAmount: RM {$amount}\nReference: {$refId}\nStatus: Completed",
            
            // Bank transfer style
            "{$dateTime->format('d/m/Y H:i')}\nTransfer Amount\nRM {$amount}\nReference No.\n{$refId}\nTransaction Date\n{$dateTime->format('d/m/Y')}\nTime\n{$dateTime->format('H:i:s')}\nStatus: Success",
        ];
        
        return $templates[array_rand($templates)];
    }
    
    /**
     * Generate parsed data JSON
     */
    private function generateParsedData(string $refId, Carbon $dateTime, string $amount): string
    {
        $transactionTypes = [
            'DuitNow QR',
            'DuitNow Transfer',
            'Bank Transfer',
            'Online Payment',
            'P2P Transfer',
        ];
        
        $data = [
            'reference_id' => $refId,
            'date' => $dateTime->format('Y-m-d'),
            'time' => $dateTime->format('H:i:s'),
            'amount' => floatval($amount),
            'transaction_type' => $transactionTypes[array_rand($transactionTypes)],
        ];
        
        return json_encode($data);
    }
    
    /**
     * Generate random digits
     */
    private function randomDigits(int $length): string
    {
        $result = '';
        for ($i = 0; $i < $length; $i++) {
            $result .= rand(0, 9);
        }
        return $result;
    }
    
    /**
     * Generate random hex string
     */
    private function randomHex(int $length): string
    {
        return substr(bin2hex(random_bytes(ceil($length / 2))), 0, $length);
    }
}

