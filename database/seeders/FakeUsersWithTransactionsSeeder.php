<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Silber\Bouncer\BouncerFacade as Bouncer;

class FakeUsersWithTransactionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Malaysian student names (realistic)
        $names = [
            'LIM WEI MING', 'TAN XIAO HUI', 'MUHAMMAD AMIN BIN AHMAD', 'SITI NURHALIZA BINTI ABDULLAH',
            'WONG KAR WAI', 'LEE SHU YI', 'AHMAD HAKIMI BIN HASSAN', 'NUR AISYAH BINTI ISMAIL',
            'CHAN YONG KANG', 'NG MEI LING', 'MOHD FAIZ BIN RAHMAN', 'NURUL HUDA BINTI YUSOF',
            'KHOO JIA WEI', 'LOW PEI SAN', 'MUHAMMAD DANISH BIN IBRAHIM', 'SITI SARAH BINTI OMAR',
            'ONG WEI JIE', 'TEO HUI MIN', 'AHMAD SYAFIQ BIN ALI', 'NOR AZLINA BINTI MOHD',
            'LIM JUN HAO', 'CHONG YI XUAN', 'MOHD AZIM BIN ZAKARIA', 'NURUL IZZAH BINTI HASHIM',
            'YEO KHAI YANG', 'GOH SU YEN', 'MUHAMMAD ARIFF BIN AZMI', 'FATIMAH ZAHRA BINTI KAMAL',
            'KOH ZI HAO', 'ANG MEI XUAN', 'AHMAD FIRDAUS BIN YUSRI', 'SITI AISYAH BINTI RAZAK',
            'CHIN WEN HAO', 'LIM YI LING', 'MOHD HAZIQ BIN ZAINAL', 'NUR SYAZWANI BINTI MANSOR',
            'TAY JUN KIAT', 'SEAH PEI QI', 'MUHAMMAD HAKIM BIN SAID', 'NOOR FARHANA BINTI ZULKIFLI',
            'SOH KAI XIANG', 'SIM YU TING', 'AHMAD IRFAN BIN KADIR', 'SITI KHADIJAH BINTI HAMID',
            'OOI WEI XIAN', 'CHEW MEI YAN', 'MOHD FIKRI BIN AZIZ', 'NURUL SYAHIRAH BINTI ROSLI',
        ];

        // Faculty IDs (1-14)
        $facultyIds = range(1, 14);
        
        // Year of study (1-4)
        $yearsOfStudy = [1, 2, 3, 4];
        
        // Entry years for matric number
        $entryYears = ['A20', 'A21', 'A22', 'A23', 'A24'];
        
        // Faculty codes for matric number
        $facultyCodes = [
            1 => 'KA', 2 => 'KT', 3 => 'KM', 4 => 'KE', 5 => 'EC', 6 => 'AI', 7 => 'FS',
            8 => 'AB', 9 => 'SH', 10 => 'FM', 11 => 'JI', 12 => 'IB', 13 => 'ET', 14 => 'SP'
        ];
        
        $users = [];
        $allTransactions = [];
        
        // Create 40 fake students
        for ($i = 0; $i < 40; $i++) {
            $name = $names[$i];
            $facultyId = $facultyIds[array_rand($facultyIds)];
            $yearOfStudy = $yearsOfStudy[array_rand($yearsOfStudy)];
            $entryYear = $entryYears[array_rand($entryYears)];
            
            // Generate matric number: A22EC0121
            $matricNo = $entryYear . $facultyCodes[$facultyId] . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            // Generate email from name
            $emailName = strtolower(str_replace(' ', '', explode(' BIN ', explode(' BINTI ', $name)[0])[0]));
            $email = $emailName . rand(100, 999) . '@graduate.utm.my';
            
            // Generate DuitNow ID (Malaysian phone number format)
            $duitnowId = '01' . rand(0, 9) . rand(10000000, 99999999);
            
            // Create user
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'matric_no' => $matricNo,
                'faculty_id' => $facultyId,
                'year_of_study' => $yearOfStudy,
                'duitnow_id' => $duitnowId,
            ]);
            
            // Assign student role
            Bouncer::assign('student')->to($user);
            
            $users[] = $user;
        }
        
        $this->command->info('Created 40 fake students.');
        
        // Now create transactions for each user with varying amounts
        // Create a realistic distribution:
        // - Top 5 users: 30-50 approved transactions (high performers)
        // - Middle 20 users: 10-30 approved transactions (average)
        // - Bottom 15 users: 1-10 approved transactions (low activity)
        
        foreach ($users as $index => $user) {
            // Determine transaction count based on position
            if ($index < 5) {
                // Top performers
                $approvedCount = rand(30, 50);
                $pendingCount = rand(3, 8);
                $rejectedCount = rand(1, 5);
            } elseif ($index < 25) {
                // Average performers
                $approvedCount = rand(10, 30);
                $pendingCount = rand(2, 5);
                $rejectedCount = rand(1, 3);
            } else {
                // Low activity
                $approvedCount = rand(1, 10);
                $pendingCount = rand(0, 2);
                $rejectedCount = rand(0, 2);
            }
            
            $totalCount = $approvedCount + $pendingCount + $rejectedCount;
            
            // Generate transactions over the past 30 days
            $transactions = $this->generateTransactionsForUser($user->id, $approvedCount, $pendingCount, $rejectedCount);
            $allTransactions = array_merge($allTransactions, $transactions);
        }
        
        // Insert all transactions in batches
        $chunks = array_chunk($allTransactions, 500);
        foreach ($chunks as $chunk) {
            Transaction::insert($chunk);
        }
        
        $this->command->info('Created ' . count($allTransactions) . ' transactions across all users.');
        $this->command->info('Seeding complete! You now have realistic leaderboard data.');
    }
    
    /**
     * Generate transactions for a specific user
     */
    private function generateTransactionsForUser($userId, $approvedCount, $pendingCount, $rejectedCount)
    {
        $transactions = [];
        $totalCount = $approvedCount + $pendingCount + $rejectedCount;
        
        // Transaction types
        $transactionTypes = [
            'DuitNow Transfer',
            'DuitNow QR',
            'DuitNow Payment',
            'Transfer',
            'Payment',
        ];
        
        // Rejection reasons
        $rejectionReasons = [
            'Receipt image is blurry or unreadable.',
            'Transaction date does not match the current week.',
            'Duplicate transaction detected.',
            'Receipt appears to be edited or manipulated.',
            'Missing required information (date, time, amount, or reference ID).',
            'Daily submission limit exceeded.',
        ];
        
        // Merchants
        $merchants = [
            'ATLAS VENDING (M) SDN BHD',
            '7-ELEVEN MALAYSIA',
            'STARBUCKS MALAYSIA',
            'MCDONALD\'S MALAYSIA',
            'KFC HOLDINGS (M) BHD',
        ];
        
        // Generate transactions over past 30 days
        $baseDate = Carbon::now();
        
        for ($i = 0; $i < $totalCount; $i++) {
            // Random date in past 30 days
            $daysAgo = rand(0, 29);
            $transactionDate = $baseDate->copy()->subDays($daysAgo);
            
            // Random time
            $hour = rand(8, 22);
            $minute = rand(0, 59);
            $second = rand(0, 59);
            $transactionTime = sprintf('%02d:%02d:%02d', $hour, $minute, $second);
            
            // Random amount
            $amount = round(rand(50, 15000) / 100, 2);
            
            // Transaction type
            $transactionType = $transactionTypes[array_rand($transactionTypes)];
            
            // Generate completely unique reference ID
            $uniqueId = $userId . str_pad($i, 4, '0', STR_PAD_LEFT) . rand(10, 99);
            
            if ($transactionType === 'DuitNow QR' || $transactionType === 'DuitNow Payment') {
                // Extract last 8 digits ensuring uniqueness
                $referenceId = $transactionDate->format('Ymd') . 'TNGDMYNB0300QR' . substr(str_pad($uniqueId, 8, '0', STR_PAD_LEFT), -8);
            } else {
                // Use unique ID ensuring it's 6 digits
                $referenceId = (string) abs(crc32($uniqueId) % 900000 + 100000);
            }
            
            // Determine status
            if ($i < $approvedCount) {
                $status = 'approved';
                $rejectionReason = null;
                $approvedAt = $transactionDate->copy()->addHours(rand(1, 3));
            } elseif ($i < $approvedCount + $pendingCount) {
                $status = 'pending';
                $rejectionReason = null;
                $approvedAt = null;
            } else {
                $status = 'rejected';
                $rejectionReason = $rejectionReasons[array_rand($rejectionReasons)];
                $approvedAt = null;
            }
            
            // OCR text
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
            
            // Receipt image path
            $receiptImagePath = 'receipts/receipt_' . $userId . '_' . time() . '_' . uniqid() . '.jpg';
            
            // Submitted at
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
        
        return $transactions;
    }
    
    /**
     * Generate realistic OCR text
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

