<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class TransactionVerificationService
{
    protected $ocrService;
    protected $parserService;
    protected $tamperingService;

    public function __construct(
        AzureOcrService $ocrService,
        OpenAiParserService $parserService,
        ImageTamperingDetectionService $tamperingService
    ) {
        $this->ocrService = $ocrService;
        $this->parserService = $parserService;
        $this->tamperingService = $tamperingService;
    }

    /**
     * Preview transaction without saving to database
     * Returns validation results and extracted data
     * 
     * @param \Illuminate\Http\UploadedFile $uploadedFile
     * @param int $userId
     * @return array
     */
    public function preview($uploadedFile, $userId)
    {
        try {
            $user = User::findOrFail($userId);
            $validations = [];

            // Step 1: Check daily submission limit
            if (!$user->canSubmitToday()) {
                return [
                    'valid' => false,
                    'data' => null,
                    'validations' => ['daily_limit' => false],
                    'image_path' => null,
                    'rejection_reason' => 'Daily submission limit reached (100/day). Please try again tomorrow.',
                    'ocr_text' => null,
                ];
            }
            $validations['daily_limit'] = true;

            // Step 2: Save image to storage (temporary)
            $imagePath = $this->saveImage($uploadedFile, $userId);

            // Step 3: Run OCR extraction
            $fullPath = Storage::path($imagePath);
            $ocrText = $this->ocrService->extractText($fullPath);
            if (empty($ocrText)) {
                return [
                    'valid' => false,
                    'data' => null,
                    'validations' => array_merge($validations, ['ocr_extracted' => false]),
                    'image_path' => $imagePath,
                    'rejection_reason' => 'Could not extract text from image. Please upload a clear screenshot.',
                    'ocr_text' => null,
                ];
            }
            $validations['ocr_extracted'] = true;

            // Step 4: Parse OCR data using AI
            $parsedData = $this->parserService->parseTransactionData($ocrText);
            if (empty($parsedData['reference_id'])) {
                return [
                    'valid' => false,
                    'data' => $parsedData,
                    'validations' => array_merge($validations, ['data_parsed' => false]),
                    'image_path' => $imagePath,
                    'rejection_reason' => 'Could not extract Reference ID from receipt. Please ensure the receipt is clear and complete.',
                    'ocr_text' => $ocrText,
                ];
            }
            $validations['data_parsed'] = true;

            // Step 5: Validate image integrity
            $tamperingCheck = $this->tamperingService->validate($fullPath);
            if (!$tamperingCheck['passed']) {
                return [
                    'valid' => false,
                    'data' => $parsedData,
                    'validations' => array_merge($validations, ['integrity_check' => false]),
                    'image_path' => $imagePath,
                    'rejection_reason' => $tamperingCheck['reason'],
                    'ocr_text' => $ocrText,
                ];
            }
            $validations['integrity_check'] = true;

            // Add image hash to parsed data if available
            if (isset($tamperingCheck['hash'])) {
                $parsedData['image_hash'] = $tamperingCheck['hash'];
            }

            // Step 6: Check for duplicate reference_id
            $duplicateExists = Transaction::where('reference_id', $parsedData['reference_id'])->exists();
            if ($duplicateExists) {
                return [
                    'valid' => false,
                    'data' => $parsedData,
                    'validations' => array_merge($validations, ['duplicate_check' => false]),
                    'image_path' => $imagePath,
                    'rejection_reason' => 'Duplicate transaction detected. This reference ID has already been submitted.',
                    'ocr_text' => $ocrText,
                ];
            }
            $validations['duplicate_check'] = true;

            // Step 7: Validate transaction date is within acceptable range
            $dateValidation = $this->validateTransactionDate($parsedData['date']);
            if (!$dateValidation['valid']) {
                return [
                    'valid' => false,
                    'data' => $parsedData,
                    'validations' => array_merge($validations, ['date_valid' => false]),
                    'image_path' => $imagePath,
                    'rejection_reason' => $dateValidation['reason'],
                    'ocr_text' => $ocrText,
                ];
            }
            $validations['date_valid'] = true;

            // All validations passed
            return [
                'valid' => true,
                'data' => $parsedData,
                'validations' => $validations,
                'image_path' => $imagePath,
                'rejection_reason' => null,
                'ocr_text' => $ocrText,
            ];
            
        } catch (Exception $e) {
            Log::error('Transaction preview failed: ' . $e->getMessage());
            
            // Provide specific error messages based on error type
            if (str_contains($e->getMessage(), 'reference_id')) {
                $rejectionReason = 'Could not extract Reference ID from receipt. Please ensure the receipt is clear and complete, or try uploading a different image.';
            } else if (str_contains($e->getMessage(), 'OpenAI API key')) {
                $rejectionReason = 'System configuration error. Please contact support.';
            } else {
                $rejectionReason = 'Unable to process the receipt. Please ensure the image is clear and contains all transaction details, then try again.';
            }
            
            return [
                'valid' => false,
                'data' => null,
                'validations' => [],
                'image_path' => $imagePath ?? null,
                'rejection_reason' => $rejectionReason,
                'ocr_text' => null,
            ];
        }
    }

    /**
     * Submit verified transaction data to database
     * 
     * @param array $previewData
     * @param int $userId
     * @return Transaction
     */
    public function submitVerifiedData($previewData, $userId)
    {
        DB::beginTransaction();
        
        try {
            // Create approved transaction
            $transaction = Transaction::create([
                'user_id' => $userId,
                'reference_id' => $previewData['data']['reference_id'],
                'transaction_date' => $previewData['data']['date'],
                'transaction_time' => $previewData['data']['time'],
                'amount' => $previewData['data']['amount'],
                'receipt_image_path' => $previewData['image_path'],
                'ocr_raw_text' => $previewData['ocr_text'],
                'parsed_data' => $previewData['data'],
                'status' => 'approved',
                'submitted_at' => now(),
                'approved_at' => now(),
            ]);

            // Increment daily submission count
            $this->incrementDailySubmissionCount($userId);

            DB::commit();
            
            Log::info("Transaction approved for user {$userId}: {$previewData['data']['reference_id']}");
            
            return $transaction;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Transaction submission failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Verify and process a transaction receipt upload
     * 
     * @param \Illuminate\Http\UploadedFile $uploadedFile
     * @param int $userId
     * @return Transaction
     */
    public function verify($uploadedFile, $userId)
    {
        DB::beginTransaction();
        
        try {
            $user = User::findOrFail($userId);

            // Step 1: Check daily submission limit
            if (!$user->canSubmitToday()) {
                return $this->createRejectedTransaction($user->id, null, 'Daily submission limit reached (100/day). Please try again tomorrow.');
            }

            // Step 2: Save image to storage
            $imagePath = $this->saveImage($uploadedFile, $userId);

            // Step 3: Run OCR extraction
            // Use Storage::path() to get the full path from the disk configuration
            $fullPath = Storage::path($imagePath);
            $ocrText = $this->ocrService->extractText($fullPath);
            if (empty($ocrText)) {
                return $this->createRejectedTransaction($userId, $imagePath, 'Could not extract text from image. Please upload a clear screenshot.');
            }

            // Step 4: Parse OCR data using AI
            $parsedData = $this->parserService->parseTransactionData($ocrText);
            if (empty($parsedData['reference_id'])) {
                return $this->createRejectedTransaction($userId, $imagePath, 'Could not extract Reference ID from receipt. Please ensure the receipt is clear and complete.', $ocrText, $parsedData);
            }

            // Step 5: Validate image integrity
            $tamperingCheck = $this->tamperingService->validate($fullPath);
            if (!$tamperingCheck['passed']) {
                return $this->createRejectedTransaction($userId, $imagePath, $tamperingCheck['reason'], $ocrText, $parsedData);
            }

            // Add image hash to parsed data if available
            if (isset($tamperingCheck['hash'])) {
                $parsedData['image_hash'] = $tamperingCheck['hash'];
            }

            // Step 6: Check for duplicate reference_id
            $duplicateExists = Transaction::where('reference_id', $parsedData['reference_id'])->exists();
            if ($duplicateExists) {
                return $this->createRejectedTransaction($userId, $imagePath, 'Duplicate transaction detected. This reference ID has already been submitted.', $ocrText, $parsedData);
            }

            // Step 7: Validate transaction date is within acceptable range
            $dateValidation = $this->validateTransactionDate($parsedData['date']);
            if (!$dateValidation['valid']) {
                return $this->createRejectedTransaction($userId, $imagePath, $dateValidation['reason'], $ocrText, $parsedData);
            }

            // Step 8: Create approved transaction
            $transaction = Transaction::create([
                'user_id' => $userId,
                'reference_id' => $parsedData['reference_id'],
                'transaction_date' => $parsedData['date'],
                'transaction_time' => $parsedData['time'],
                'amount' => $parsedData['amount'],
                'receipt_image_path' => $imagePath,
                'ocr_raw_text' => $ocrText,
                'parsed_data' => $parsedData,
                'status' => 'approved',
                'submitted_at' => now(),
                'approved_at' => now(),
            ]);

            // Step 9: Increment daily submission count
            $this->incrementDailySubmissionCount($userId);

            DB::commit();
            
            Log::info("Transaction approved for user {$userId}: {$parsedData['reference_id']}");
            
            return $transaction;
            
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Transaction verification failed: ' . $e->getMessage());
            
            return $this->createRejectedTransaction(
                $userId,
                $imagePath ?? null,
                'System error during verification. Please try again later.'
            );
        }
    }

    /**
     * Save uploaded image to storage
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @param int $userId
     * @return string Path to saved file
     */
    protected function saveImage($file, $userId)
    {
        $filename = 'receipt_' . $userId . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        
        // Store in receipts directory using the local disk
        // This will save to storage/app/receipts/
        $path = $file->storeAs('receipts', $filename);
        
        return $path;
    }

    /**
     * Validate transaction date
     * 
     * @param string $date Date in Y-m-d format
     * @return array ['valid' => bool, 'reason' => string|null]
     */
    protected function validateTransactionDate($date)
    {
        try {
            $transactionDate = Carbon::parse($date);
            $now = Carbon::now('Asia/Kuala_Lumpur');

            // Check if transaction date is in the future
            if ($transactionDate->isFuture()) {
                return [
                    'valid' => false,
                    'reason' => 'Transaction date cannot be in the future.'
                ];
            }

            // Check if the competition has ended
            if (\App\Helpers\CompetitionWeekHelper::hasCompetitionEnded()) {
                $endDateString = \App\Helpers\CompetitionWeekHelper::getCompetitionEndDateString();
                return [
                    'valid' => false,
                    'reason' => 'The competition has ended on ' . $endDateString . '. No more receipts can be submitted.'
                ];
            }

            // Check if transaction date is after competition end date
            if (!\App\Helpers\CompetitionWeekHelper::isWithinCompetitionPeriod($transactionDate)) {
                $endDateString = \App\Helpers\CompetitionWeekHelper::getCompetitionEndDateString();
                return [
                    'valid' => false,
                    'reason' => 'Only receipts dated before ' . $endDateString . ' are accepted. The competition has ended.'
                ];
            }

            // Get the current competition week boundaries
            $boundaries = \App\Helpers\CompetitionWeekHelper::getCurrentWeekBoundaries();

            if ($boundaries === null) {
                return [
                    'valid' => false,
                    'reason' => 'The competition has not started yet. Competition starts on November 1, 2025.'
                ];
            }

            // Check if transaction is from the current competition week
            $isCurrentWeek = $transactionDate->between($boundaries['start'], $boundaries['end']);

            if (!$isCurrentWeek) {
                $weekRangeString = \App\Helpers\CompetitionWeekHelper::getWeekRangeString();
                return [
                    'valid' => false,
                    'reason' => 'Only receipts from the current competition week are accepted. ' . $weekRangeString . '.'
                ];
            }

            return ['valid' => true, 'reason' => null];
            
        } catch (Exception $e) {
            return [
                'valid' => false,
                'reason' => 'Invalid transaction date format.'
            ];
        }
    }

    /**
     * Check EXIF data for editing software signatures
     * 
     * @param string $imagePath
     * @return array
     */
    protected function checkExifData($imagePath)
    {
        if (!function_exists('exif_read_data')) {
            return ['passed' => true, 'reason' => null];
        }

        try {
            $exif = @exif_read_data($imagePath);
            
            if ($exif === false) {
                // No EXIF data - could be stripped, which is suspicious
                Log::warning('No EXIF data in image: ' . $imagePath);
                // Don't reject based on this alone
                return ['passed' => true, 'reason' => null];
            }

            // Check for editing software
            $suspiciousSoftware = ['photoshop', 'gimp', 'paint', 'pixlr', 'canva', 'editor'];
            
            if (isset($exif['Software'])) {
                $software = strtolower($exif['Software']);
                foreach ($suspiciousSoftware as $editor) {
                    if (strpos($software, $editor) !== false) {
                        return [
                            'passed' => false,
                            'reason' => 'Image shows signs of editing. Please submit original screenshot.'
                        ];
                    }
                }
            }

            return ['passed' => true, 'reason' => null];
            
        } catch (Exception $e) {
            return ['passed' => true, 'reason' => null];
        }
    }

    /**
     * Generate and check image hash for duplicates
     * 
     * @param string $imagePath
     * @return array
     */
    protected function checkImageHash($imagePath)
    {
        $hash = md5_file($imagePath);
        
        // Check if this exact image file has been submitted before
        $duplicate = DB::table('transactions')
            ->whereRaw("parsed_data->>'image_hash' = ?", [$hash])
            ->exists();
        
        if ($duplicate) {
            return [
                'passed' => false,
                'reason' => 'This exact image has already been submitted previously.'
            ];
        }

        return [
            'passed' => true,
            'reason' => null,
            'hash' => $hash
        ];
    }

    /**
     * Check basic file integrity
     * 
     * @param string $imagePath
     * @return array
     */
    protected function checkFileIntegrity($imagePath)
    {
        $imageInfo = @getimagesize($imagePath);
        
        if ($imageInfo === false) {
            return [
                'passed' => false,
                'reason' => 'Invalid or corrupted image file.'
            ];
        }

        // Check minimum dimensions
        if ($imageInfo[0] < 200 || $imageInfo[1] < 200) {
            return [
                'passed' => false,
                'reason' => 'Image resolution too low. Please upload a clear screenshot.'
            ];
        }

        return ['passed' => true, 'reason' => null];
    }

    /**
     * Create a rejected transaction record
     * 
     * @param int $userId
     * @param string|null $imagePath
     * @param string $reason
     * @param string|null $ocrText
     * @param array|null $parsedData
     * @return Transaction
     */
    protected function createRejectedTransaction($userId, $imagePath, $reason, $ocrText = null, $parsedData = null)
    {
        $transaction = Transaction::create([
            'user_id' => $userId,
            'reference_id' => $parsedData['reference_id'] ?? 'REJECTED_' . time() . '_' . rand(1000, 9999),
            'transaction_date' => $parsedData['date'] ?? now()->toDateString(),
            'transaction_time' => $parsedData['time'] ?? now()->toTimeString(),
            'amount' => $parsedData['amount'] ?? 0,
            'receipt_image_path' => $imagePath ?? '',
            'ocr_raw_text' => $ocrText,
            'parsed_data' => $parsedData,
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'submitted_at' => now(),
        ]);

        // Still increment daily submission count (to prevent spam)
        $this->incrementDailySubmissionCount($userId);

        DB::commit();
        
        Log::info("Transaction rejected for user {$userId}: {$reason}");
        
        return $transaction;
    }

    /**
     * Increment the daily submission count for a user
     * 
     * @param int $userId
     */
    protected function incrementDailySubmissionCount($userId)
    {
        $today = now()->toDateString();
        
        DB::table('daily_submission_limits')->updateOrInsert(
            [
                'user_id' => $userId,
                'date' => $today,
            ],
            [
                'submission_count' => DB::raw('submission_count + 1'),
                'updated_at' => now(),
            ]
        );

        // For new records, set submission_count to 1
        DB::statement(
            "UPDATE daily_submission_limits SET submission_count = 1 WHERE user_id = ? AND date = ? AND submission_count = 0",
            [$userId, $today]
        );
    }
}

