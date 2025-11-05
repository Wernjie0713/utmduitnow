<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Silber\Bouncer\BouncerFacade as Bouncer;

class MassiveDemoDataSeeder extends Seeder
{
    /**
     * Massive Demo Data Seeder for UTM DuitNow Competition
     * 
     * Based on REAL DATA PATTERNS analyzed from production database:
     * - 2,000+ realistic Malaysian student users
     * - 40,000+ transactions (Oct 6-31, 2025)
     * - Top 10 users MUST be from real users with original percentages
     * - All approved status
     * - Realistic distributions matching production data
     */
    public function run(): void
    {
        $startTime = microtime(true);
        echo "\n🚀 Starting Massive Demo Data Seeding...\n";
        echo "================================================\n\n";
        
        // Step 1: Create 2000+ users
        echo "📝 Step 1: Creating 2,000+ users...\n";
        $newUserIds = $this->createUsers(2000);
        echo "✅ Created " . count($newUserIds) . " new users!\n\n";
        
        // Step 2: Get real user IDs for top 10
        $realTopUsers = [6, 10, 19, 12, 21, 36, 18, 46, 17, 7];
        
        // Step 3: Create 40,000+ transactions
        echo "📝 Step 2: Creating 40,000+ transactions...\n";
        $transactionCount = $this->createTransactions(40000, $realTopUsers, $newUserIds);
        echo "✅ Created {$transactionCount} transactions!\n\n";
        
        $endTime = microtime(true);
        $duration = round($endTime - $startTime, 2);
        
        echo "================================================\n";
        echo "🎉 Seeding Complete!\n";
        echo "⏱️  Duration: {$duration} seconds\n";
        echo "👥 New Users: " . count($newUserIds) . "\n";
        echo "💰 New Transactions: {$transactionCount}\n";
        echo "================================================\n\n";
    }
    
    /**
     * Create 2000+ realistic Malaysian student users
     */
    private function createUsers(int $count): array
    {
        // Malaysian names pool (balanced ethnic distribution)
        $chineseNames = [
            'LIM', 'TAN', 'WONG', 'LEE', 'ONG', 'NG', 'CHAN', 'CHONG', 'GOH', 'TEO',
            'LOW', 'KHOO', 'YEO', 'KOH', 'ANG', 'CHIN', 'TAY', 'SEAH', 'SOH', 'SIM',
            'OOI', 'CHEW', 'KOAY', 'CHIA', 'FONG', 'HOO', 'LUI', 'MAH', 'SIA', 'YAP'
        ];
        
        $chineseGivenNames = [
            'WEI MING', 'XIAO HUI', 'KAR WAI', 'SHU YI', 'YONG KANG', 'MEI LING',
            'JIA WEI', 'PEI SAN', 'WEI JIE', 'HUI MIN', 'JUN HAO', 'YI XUAN',
            'KHAI YANG', 'SU YEN', 'ZI HAO', 'MEI XUAN', 'WEN HAO', 'YI LING',
            'JUN KIAT', 'PEI QI', 'KAI XIANG', 'YU TING', 'WEI XIAN', 'MEI YAN',
            'ZI JIAN', 'QI XIN', 'YONG SHENG', 'HUI XIAN', 'JIA YI', 'SHU EN'
        ];
        
        $malayNames = [
            'MUHAMMAD', 'AHMAD', 'MOHD', 'SITI', 'NUR', 'NURUL', 'AISYAH', 'FATIMAH',
            'AHMAD', 'AMIR', 'DANIEL', 'DANISH', 'FAIZ', 'HAKIMI', 'IRFAN', 'SYAFIQ',
            'AINA', 'AMIRA', 'BALQIS', 'HANNAH', 'INSYIRAH', 'MAISARAH', 'QISTINA', 'SARAH'
        ];
        
        $malayGivenNames = [
            'AMIN BIN AHMAD', 'NURHALIZA BINTI ABDULLAH', 'HAKIMI BIN HASSAN', 'AISYAH BINTI ISMAIL',
            'FAIZ BIN RAHMAN', 'HUDA BINTI YUSOF', 'DANISH BIN IBRAHIM', 'SARAH BINTI OMAR',
            'SYAFIQ BIN ALI', 'AZLINA BINTI MOHD', 'AZIM BIN ZAKARIA', 'IZZAH BINTI HASHIM',
            'ARIFF BIN AZMI', 'ZAHRA BINTI KAMAL', 'FIRDAUS BIN YUSRI', 'AISYAH BINTI RAZAK',
            'HAZIQ BIN ZAINAL', 'SYAZWANI BINTI MANSOR', 'HAKIM BIN SAID', 'FARHANA BINTI ZULKIFLI',
            'IRFAN BIN KADIR', 'KHADIJAH BINTI HAMID', 'FIKRI BIN AZIZ', 'SYAHIRAH BINTI ROSLI'
        ];
        
        $indianNames = [
            'KUMAR', 'RAJ', 'DEVI', 'LAKSHMANAN', 'SURESH', 'RAVI', 'SANJAY', 'VIJAY',
            'PRIYA', 'KAVITHA', 'NISHA', 'DEEPA', 'ARJUN', 'KARTHIK', 'SELVAM', 'GANESH'
        ];
        
        // Faculty codes and IDs (based on real data)
        $facultyData = [
            1 => 'KA',   // Civil Engineering - 4%
            2 => 'KT',   // Chemical Engineering - 4%
            3 => 'KM',   // Mechanical Engineering - 8%
            4 => 'KE',   // Electrical Engineering - 14%
            5 => 'EC',   // Computing - 45% (most common)
            6 => 'AI',   // Artificial Intelligence - 5%
            7 => 'FS',   // Science - 11%
            8 => 'AB',   // Built Environment - 4%
            9 => 'SH',   // Social Sciences - 3%
            10 => 'FM',  // Management - 2%
            11 => 'JI',  // MJIIT - 2%
            12 => 'IB',  // AHIBS - 1%
            13 => 'HP',  // Educational Sciences - 2%
            14 => 'SP',  // SPACE - 11%
        ];
        
        // Faculty distribution (based on real data)
        $facultyDistribution = [
            5 => 45,   // Computing (most popular)
            4 => 14,   // Electrical
            7 => 11,   // Science
            14 => 11,  // SPACE
            3 => 8,    // Mechanical
            6 => 5,    // AI
            1 => 4,    // Civil
            2 => 4,    // Chemical
            8 => 4,    // Built Environment
            9 => 3,    // Social Sciences
            13 => 2,   // Educational
            10 => 2,   // Management
            11 => 2,   // MJIIT
            12 => 1,   // AHIBS
        ];
        
        // Year distribution (based on real data)
        $yearDistribution = [
            3 => 48,  // Year 3 (most common)
            1 => 27,  // Year 1
            2 => 23,  // Year 2
            4 => 2,   // Year 4 (least common)
        ];
        
        // Entry years for matric numbers
        $entryYears = ['A22', 'A23', 'A24', 'A25'];
        
        $users = [];
        $usedEmails = collect();
        $usedMatricNos = collect();
        $usedDuitnowIds = collect();
        
        // Get existing emails, matric nos, and duitnow ids to avoid duplicates
        $existingEmails = DB::table('users')->pluck('email');
        $existingMatricNos = DB::table('users')->whereNotNull('matric_no')->pluck('matric_no');
        $existingDuitnowIds = DB::table('users')->whereNotNull('duitnow_id')->pluck('duitnow_id');
        
        $usedEmails = $usedEmails->merge($existingEmails);
        $usedMatricNos = $usedMatricNos->merge($existingMatricNos);
        $usedDuitnowIds = $usedDuitnowIds->merge($existingDuitnowIds);
        
        $batchSize = 500;
        $userIds = [];
        
        for ($i = 0; $i < $count; $i++) {
            // Determine ethnicity (70% Chinese, 20% Malay, 10% Indian for diversity)
            $rand = rand(1, 100);
            if ($rand <= 70) {
                // Chinese name
                $surname = $chineseNames[array_rand($chineseNames)];
                $givenName = $chineseGivenNames[array_rand($chineseGivenNames)];
                $fullName = $surname . ' ' . $givenName;
            } elseif ($rand <= 90) {
                // Malay name
                $firstName = $malayNames[array_rand($malayNames)];
                $fullName = $firstName . ' ' . $malayGivenNames[array_rand($malayGivenNames)];
            } else {
                // Indian name
                $givenName = ['ARUN', 'DINESH', 'MUTHU', 'PRAKASH', 'VENU', 'DIVYA', 'LAKSHMI', 'SHANTI'][rand(0, 7)];
                $surname = $indianNames[array_rand($indianNames)];
                $fullName = $givenName . ' ' . $surname . ' A/L ' . ['RAMAN', 'KRISHNAN', 'SELVAM', 'NAIDU'][rand(0, 3)];
            }
            
            // Select faculty based on distribution
            $facultyId = $this->selectByDistribution($facultyDistribution);
            $facultyCode = $facultyData[$facultyId];
            
            // Select year based on distribution
            $yearOfStudy = $this->selectByDistribution($yearDistribution);
            
            // Determine appropriate entry year based on year of study
            $currentYear = 2025;
            $entryYear = match($yearOfStudy) {
                1 => 'A25',
                2 => 'A24',
                3 => 'A23',
                4 => 'A22',
                default => 'A23',
            };
            
            // Generate unique matric number
            $matricNo = $this->generateUniqueMatricNo($entryYear, $facultyCode, $usedMatricNos);
            $usedMatricNos->push($matricNo);
            
            // Generate unique email
            $email = $this->generateUniqueEmail($fullName, $usedEmails);
            $usedEmails->push($email);
            
            // Generate unique DuitNow ID (Malaysian phone format)
            $duitnowId = $this->generateUniqueDuitnowId($usedDuitnowIds);
            $usedDuitnowIds->push($duitnowId);
            
            // Generate phone number
            $phoneNumber = '+601' . rand(0, 9) . rand(10000000, 99999999);
            
            $users[] = [
                'name' => strtoupper($fullName),
                'email' => $email,
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'phone_number' => $phoneNumber,
                'matric_no' => $matricNo,
                'faculty_id' => $facultyId,
                'year_of_study' => $yearOfStudy,
                'duitnow_id' => $duitnowId,
                'profile_completed' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            // Insert in batches
            if (count($users) >= $batchSize) {
                $insertedIds = $this->insertUsersAndGetIds($users);
                $userIds = array_merge($userIds, $insertedIds);
                echo "  → Inserted " . count($insertedIds) . " users (Total: " . count($userIds) . ")\n";
                $users = [];
            }
        }
        
        // Insert remaining users
        if (count($users) > 0) {
            $insertedIds = $this->insertUsersAndGetIds($users);
            $userIds = array_merge($userIds, $insertedIds);
            echo "  → Inserted final batch: " . count($insertedIds) . " users\n";
        }
        
        return $userIds;
    }
    
    /**
     * Insert users and return their IDs
     */
    private function insertUsersAndGetIds(array $users): array
    {
        $userIds = [];
        
        foreach ($users as $userData) {
            $user = User::create($userData);
            
            // Assign student role
            try {
                Bouncer::assign('student')->to($user);
            } catch (\Exception $e) {
                // Role might not exist in some environments, continue anyway
            }
            
            $userIds[] = $user->id;
        }
        
        return $userIds;
    }
    
    /**
     * Create 40,000+ transactions with realistic distribution
     */
    private function createTransactions(int $targetCount, array $topUserIds, array $newUserIds): int
    {
        // Transaction distribution based on REAL data percentages
        // Top 10 users account for: 1655/1758 = 94.1% of transactions
        $topUsersDistribution = [
            6  => 16.6,  // 292 transactions
            10 => 13.1,  // 230 transactions
            19 => 12.2,  // 214 transactions
            12 => 11.7,  // 205 transactions
            21 => 10.6,  // 187 transactions
            36 => 10.4,  // 183 transactions
            18 => 5.7,   // 101 transactions
            46 => 5.7,   // 100 transactions
            17 => 4.3,   // 75 transactions
            7  => 3.9,   // 68 transactions
        ];
        
        // Calculate transactions for top 10 (94.1% of total)
        $topUsersTransactionCount = (int) ($targetCount * 0.941);
        $remainingTransactionCount = $targetCount - $topUsersTransactionCount;
        
        echo "  → Top 10 users will get: {$topUsersTransactionCount} transactions (94.1%)\n";
        echo "  → Other " . count($newUserIds) . " users will share: {$remainingTransactionCount} transactions (5.9%)\n\n";
        
        $transactions = [];
        $usedReferenceIds = collect();
        $usedReceiptPaths = collect();
        $insertedCount = 0;
        $batchSize = 500;
        
        // Get existing reference IDs to avoid duplicates
        $existingRefIds = DB::table('transactions')->pluck('reference_id');
        $usedReferenceIds = $usedReferenceIds->merge($existingRefIds);
        
        // Step 1: Generate transactions for top 10 users
        foreach ($topUsersDistribution as $userId => $percentage) {
            $userTransactionCount = (int) ($targetCount * ($percentage / 100));
            
            echo "  → Generating {$userTransactionCount} transactions for user #{$userId}...\n";
            
            for ($i = 0; $i < $userTransactionCount; $i++) {
                $transaction = $this->generateTransaction(
                    $userId,
                    $usedReferenceIds,
                    $usedReceiptPaths
                );
                
                $transactions[] = $transaction;
                $usedReferenceIds->push($transaction['reference_id']);
                $usedReceiptPaths->push($transaction['receipt_image_path']);
                
                // Insert in batches
                if (count($transactions) >= $batchSize) {
                    DB::table('transactions')->insert($transactions);
                    $insertedCount += count($transactions);
                    echo "    ✓ Inserted batch (Total: {$insertedCount})\n";
                    $transactions = [];
                }
            }
        }
        
        // Step 2: Generate transactions for remaining users (distributed randomly)
        echo "\n  → Generating {$remainingTransactionCount} transactions for other users...\n";
        
        $allUserPool = array_merge($topUserIds, $newUserIds);
        
        for ($i = 0; $i < $remainingTransactionCount; $i++) {
            // Randomly select a user from the pool
            $userId = $allUserPool[array_rand($allUserPool)];
            
            $transaction = $this->generateTransaction(
                $userId,
                $usedReferenceIds,
                $usedReceiptPaths
            );
            
            $transactions[] = $transaction;
            $usedReferenceIds->push($transaction['reference_id']);
            $usedReceiptPaths->push($transaction['receipt_image_path']);
            
            // Insert in batches
            if (count($transactions) >= $batchSize) {
                DB::table('transactions')->insert($transactions);
                $insertedCount += count($transactions);
                
                if ($insertedCount % 5000 == 0) {
                    echo "    ✓ Progress: {$insertedCount} / {$targetCount}\n";
                }
                
                $transactions = [];
            }
        }
        
        // Insert remaining transactions
        if (count($transactions) > 0) {
            DB::table('transactions')->insert($transactions);
            $insertedCount += count($transactions);
            echo "    ✓ Inserted final batch (Total: {$insertedCount})\n";
        }
        
        return $insertedCount;
    }
    
    /**
     * Generate a single transaction with realistic data
     */
    private function generateTransaction(int $userId, $usedReferenceIds, $usedReceiptPaths): array
    {
        // Generate date between Oct 6-31, 2025
        $transactionDateTime = $this->generateOctoberDateTime();
        
        // Generate amount based on real distribution
        $amount = $this->generateRealisticAmount();
        
        // Generate unique reference ID
        $referenceId = $this->generateUniqueReferenceId($usedReferenceIds, $transactionDateTime);
        
        // Generate unique receipt path
        $receiptPath = $this->generateUniqueReceiptPath($userId, $usedReceiptPaths, $transactionDateTime);
        
        // Generate OCR text
        $ocrText = $this->generateOcrText($referenceId, $transactionDateTime, $amount);
        
        // Generate parsed data
        $parsedData = $this->generateParsedData($referenceId, $transactionDateTime, $amount);
        
        return [
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
    }
    
    /**
     * Generate random datetime between Oct 6-31, 2025
     */
    private function generateOctoberDateTime(): Carbon
    {
        // October 6-31, 2025
        $day = rand(6, 31);
        
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
     * Generate amount based on REAL distribution
     * 54% (0-5 RM), 17% (5-10 RM), 18% (10-20 RM), 9% (negative), 2% (other)
     */
    private function generateRealisticAmount(): string
    {
        $random = rand(1, 100);
        
        if ($random <= 54) {
            // 0-5 RM (54%)
            return number_format(mt_rand(1, 500) / 100, 2, '.', '');
        } elseif ($random <= 71) {
            // 5-10 RM (17%)
            return number_format(mt_rand(500, 1000) / 100, 2, '.', '');
        } elseif ($random <= 89) {
            // 10-20 RM (18%)
            return number_format(mt_rand(1000, 2000) / 100, 2, '.', '');
        } elseif ($random <= 98) {
            // Negative/refunds (9%)
            return '-' . number_format(mt_rand(100, 1000) / 100, 2, '.', '');
        } elseif ($random <= 99) {
            // 20-100 RM (1%)
            return number_format(mt_rand(2000, 10000) / 100, 2, '.', '');
        } else {
            // 100+ RM (1%)
            return number_format(mt_rand(10000, 50000) / 100, 2, '.', '');
        }
    }
    
    /**
     * Generate unique reference ID based on REAL formats
     * Format distribution: RHBBMYKL (47%), TNGDMYNB (25%), numeric (15%), P-prefix (5%), others (8%)
     */
    private function generateUniqueReferenceId($usedIds, Carbon $dateTime): string
    {
        $maxAttempts = 100;
        $attempt = 0;
        
        do {
            $random = rand(1, 100);
            
            if ($random <= 47) {
                // RHBBMYKL format (47%)
                $referenceId = $dateTime->format('Ymd') . 'RHBBMYKL040OQR' . $this->randomDigits(8);
            } elseif ($random <= 72) {
                // TNGDMYNB format (25%)
                $variants = ['010ORM', '01OORM', '0100RM', '0300QR', '040OQR'];
                $referenceId = $dateTime->format('Ymd') . 'TNGDMYNB' . $variants[array_rand($variants)] . $this->randomDigits(8);
            } elseif ($random <= 87) {
                // Long numeric format (15%)
                $referenceId = $dateTime->format('Ymd') . $this->randomDigits(rand(20, 28));
            } elseif ($random <= 92) {
                // P-prefix format (5%)
                $referenceId = 'P' . $dateTime->format('ymd') . str_pad(rand(0, 999999999), 9, '0', STR_PAD_LEFT);
            } elseif ($random <= 95) {
                // 8 digits + M suffix (3%)
                $referenceId = str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT) . 'M';
            } elseif ($random <= 98) {
                // Simple 6-digit (3%)
                $referenceId = $this->randomDigits(6);
            } else {
                // QR format (2%)
                $referenceId = 'QR' . $this->randomDigits(8);
            }
            
            $attempt++;
            
            if ($attempt >= $maxAttempts) {
                // Fallback to guaranteed unique format
                $referenceId = 'DEMO' . $dateTime->format('YmdHis') . $this->randomDigits(8) . uniqid();
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
        $maxAttempts = 50;
        $attempt = 0;
        
        do {
            $timestamp = $dateTime->timestamp + rand(0, 999);
            $random = $this->randomHex(13);
            $extension = rand(1, 100) > 30 ? 'jpg' : 'png'; // 70% jpg, 30% png
            
            $path = "receipts/receipt_{$userId}_{$timestamp}_{$random}.{$extension}";
            
            $attempt++;
            
            if ($attempt >= $maxAttempts) {
                $path = "receipts/receipt_{$userId}_" . uniqid() . "_{$random}.{$extension}";
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
            "Status\nSuccessful\n{$dateTime->format('h:i')}AM {$dateTime->format('l, j F Y')} MYT\nAmount\nMYR {$amount}\nDuitNow\nQR\nReference ID {$refId}\nFrom\nSavings Account\nTo\nMerchant Payment\nPayment Type\nDuitNow QR P2P\nShare Receipt",
            "{$dateTime->format('H:i')}\nSuccessful\nRM {$amount}\n{$dateTime->format('j M Y, h:i A')}\nDuit Now\nPaid from\nMain Account\nReference ID\n{$refId}\nDone\nShare receipt",
            "Transaction Successful\n{$dateTime->format('d/m/Y')}\n{$dateTime->format('H:i:s')}\nAmount: RM {$amount}\nReference: {$refId}\nStatus: Completed",
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
     * Select value based on distribution percentages
     */
    private function selectByDistribution(array $distribution): int
    {
        $random = mt_rand(1, 10000) / 100; // More precise: 0.01 to 100.00
        
        $cumulative = 0;
        foreach ($distribution as $value => $percentage) {
            $cumulative += $percentage;
            if ($random <= $cumulative) {
                return $value;
            }
        }
        
        // Fallback to first key
        return array_key_first($distribution);
    }
    
    /**
     * Generate unique matric number
     */
    private function generateUniqueMatricNo(string $entryYear, string $facultyCode, $usedMatricNos): string
    {
        $maxAttempts = 100;
        $attempt = 0;
        
        do {
            $number = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $matricNo = $entryYear . $facultyCode . $number;
            $attempt++;
            
            if ($attempt >= $maxAttempts) {
                // Use timestamp-based unique number
                $number = str_pad(time() % 9999, 4, '0', STR_PAD_LEFT);
                $matricNo = $entryYear . $facultyCode . $number;
                break;
            }
            
        } while ($usedMatricNos->contains($matricNo));
        
        return $matricNo;
    }
    
    /**
     * Generate unique email
     */
    private function generateUniqueEmail(string $fullName, $usedEmails): string
    {
        // Clean name and create base email
        $nameParts = explode(' ', strtolower($fullName));
        $baseName = '';
        
        // Take first part and last part
        if (count($nameParts) >= 2) {
            $baseName = $nameParts[0] . $nameParts[count($nameParts) - 1];
        } else {
            $baseName = $nameParts[0];
        }
        
        // Remove special characters
        $baseName = preg_replace('/[^a-z0-9]/', '', $baseName);
        
        // Try with random numbers
        $maxAttempts = 50;
        $attempt = 0;
        
        do {
            if ($attempt == 0) {
                $email = $baseName . '@graduate.utm.my';
            } else {
                $email = $baseName . rand(100, 9999) . '@graduate.utm.my';
            }
            
            $attempt++;
            
            if ($attempt >= $maxAttempts) {
                $email = $baseName . time() . rand(100, 999) . '@graduate.utm.my';
                break;
            }
            
        } while ($usedEmails->contains($email));
        
        return $email;
    }
    
    /**
     * Generate unique DuitNow ID
     */
    private function generateUniqueDuitnowId($usedDuitnowIds): string
    {
        $maxAttempts = 50;
        $attempt = 0;
        
        do {
            // Malaysian phone format: 12 digits or 01XXXXXXXXX
            $format = rand(1, 100);
            
            if ($format <= 70) {
                // 12-digit format (70%)
                $duitnowId = $this->randomDigits(12);
            } else {
                // 01X-XXXXXXXX format (30%)
                $duitnowId = '01' . rand(0, 9) . rand(10000000, 99999999);
            }
            
            $attempt++;
            
            if ($attempt >= $maxAttempts) {
                $duitnowId = time() . rand(1000, 9999);
                break;
            }
            
        } while ($usedDuitnowIds->contains($duitnowId));
        
        return $duitnowId;
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

