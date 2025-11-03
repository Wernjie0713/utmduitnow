<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class OpenAiParserService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
    }

    /**
     * Parse transaction data from OCR text using OpenAI GPT
     * 
     * @param string $ocrText Raw OCR text
     * @return array Parsed transaction data
     */
    public function parseTransactionData($ocrText)
    {
        try {
            // Check if OpenAI API key is configured
            if (empty($this->apiKey) || $this->apiKey === 'your_openai_key_here') {
                throw new Exception('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
            }

            $prompt = $this->buildPrompt($ocrText);
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-5-nano',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a precise data extraction assistant. You must follow step-by-step instructions exactly. When extracting reference IDs, always check if they continue on the next line. Return ONLY valid JSON, no explanations.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
            ]);

            if (!$response->successful()) {
                throw new Exception('OpenAI API request failed: ' . $response->body());
            }

            $result = $response->json();
            
            if (!isset($result['choices'][0]['message']['content'])) {
                throw new Exception('Invalid response from OpenAI API');
            }

            $content = $result['choices'][0]['message']['content'];

            // Debug log to show OpenAI response
            Log::debug('OpenAI Parser Response', [
                'raw_content' => $content,
                'timestamp' => now()->toISOString(),
            ]);

            // Clean the content - remove markdown code blocks if present
            $cleanContent = trim($content);
            if (str_starts_with($cleanContent, '```json')) {
                $cleanContent = str_replace(['```json', '```'], '', $cleanContent);
                $cleanContent = trim($cleanContent);
            }

            // Parse the JSON response
            $parsed = json_decode($cleanContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON Parse Error', [
                    'json_error' => json_last_error_msg(),
                    'raw_content' => $content,
                    'clean_content' => $cleanContent,
                    'timestamp' => now()->toISOString(),
                ]);
                throw new Exception('Failed to parse OpenAI response as JSON: ' . json_last_error_msg());
            }

            // Debug log to show parsed data
            Log::debug('OpenAI Parsed Transaction Data', [
                'parsed_data' => $parsed,
                'timestamp' => now()->toISOString(),
            ]);

            // Validate required fields
            $this->validateParsedData($parsed);

            return $parsed;
            
        } catch (Exception $e) {
            Log::error('OpenAI parsing failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Build the prompt for OpenAI
     * 
     * @param string $ocrText
     * @return string
     */
    protected function buildPrompt($ocrText)
    {
        return "You are extracting transaction data from a DuitNow receipt. Return ONLY valid JSON.\n\n" .
               "=== OCR TEXT START ===\n{$ocrText}\n=== OCR TEXT END ===\n\n" .
               "STEP 1: Find the Reference ID\n" .
               "Search for these labels (in order of priority):\n" .
               "1. 'Transaction No.' or 'Trans No.' (HIGHEST PRIORITY)\n" .
               "2. 'Reference No.' or 'Reference ID' or 'Ref No.'\n" .
               "3. 'DuitNow Ref No.' or 'DuitNow Reference No.'\n" .
               "4. 'Transaction ID' or 'Trans ID'\n\n" .
               "CRITICAL: NEVER use 'Wallet Ref' or 'Wallet Reference' - these are ALWAYS incorrect!\n" .
               "If you see both 'Wallet Ref' and 'Transaction No.', ALWAYS use 'Transaction No.'!\n\n" .
               "STEP 2: Handle Multi-Line Reference IDs (VERY IMPORTANT!)\n" .
               "Reference IDs often wrap to the next line. Follow this process:\n" .
               "a) Read the text IMMEDIATELY after the reference label (same line)\n" .
               "b) Look at the VERY NEXT LINE in the OCR text\n" .
               "c) If the next line is a continuation, it's part of the reference ID. Signs of continuation:\n" .
               "   - Short alphanumeric text (1-20 characters)\n" .
               "   - No colon (:) at the end (colons indicate labels like 'Date:', 'Time:')\n" .
               "   - Not a known label like 'Status', 'Date', 'Time', 'Amount'\n" .
               "d) Keep checking subsequent lines until you hit a label or unrelated text\n" .
               "e) Combine ALL continuation lines WITHOUT spaces: Line1 + Line2 + Line3... = Complete Reference ID\n\n" .
               "Examples of multi-line reference IDs:\n" .
               "Input: 'Reference ID 20251101RHBBMYKL040OQR57821\\n806'\n" .
               "Output: '20251101RHBBMYKL040OQR57821806'\n\n" .
               "Input: 'Transaction No.\\n11a227ac-6f55-4f40-9a9b-\\nd9755b43d7ba'\n" .
               "Output: '11a227ac-6f55-4f40-9a9b-d9755b43d7ba'\n\n" .
               "Input: 'Ref No. ABC123XYZ789DEF456\\n123'\n" .
               "Output: 'ABC123XYZ789DEF456123'\n\n" .
               "Input: 'Reference No.\\n20251101BANK12345\\n678'\n" .
               "Output: '20251101BANK12345678'\n\n" .
               "IMPORTANT RULES for Reference ID:\n" .
               "- Transaction No. (with UUID format) can span 2-3 lines - combine them all\n" .
               "- Numeric references (like 20251101...) can span 2 lines - combine them\n" .
               "- STOP combining when you hit a label ending with ':' (Date:, Time:, Status:)\n" .
               "- STOP combining when you hit keywords like 'Status', 'Successful', 'Failed'\n" .
               "- Remove ALL spaces, newlines, and hyphens at line breaks from the final reference ID\n" .
               "- Keep hyphens that are part of UUIDs (e.g., '11a227ac-6f55-4f40')\n" .
               "- NEVER use 'Wallet Ref' - it's always wrong!\n" .
               "- If no reference is found, return null\n\n" .
               "STEP 3: Extract Date (Malaysian Format DD/MM/YYYY)\n" .
               "- Find: 'Date:', 'Transaction Date:', or similar\n" .
               "- Malaysian format: DD/MM/YYYY (Day/Month/Year)\n" .
               "- Convert to: YYYY-MM-DD\n" .
               "- Example: '01/11/2025' = 1 November 2025 = '2025-11-01' (NOT January 11!)\n" .
               "- Example: '15/12/2025' = 15 December 2025 = '2025-12-15'\n\n" .
               "STEP 4: Extract Time\n" .
               "- Find: 'Time:', 'Transaction Time:', or similar\n" .
               "- Format: HH:MM:SS (24-hour format)\n" .
               "- If seconds missing, add ':00'\n\n" .
               "STEP 5: Extract Amount\n" .
               "- Find: 'Amount:', 'Total:', 'RM', or similar\n" .
               "- Extract ONLY the numeric value (no 'RM', no currency symbols)\n" .
               "- Keep decimal point: '50.00' not '50'\n\n" .
               "STEP 6: Extract Transaction Type\n" .
               "Look for these keywords (priority order):\n" .
               "1. 'DuitNow QR' → return 'DuitNow QR'\n" .
               "2. 'DuitNow Transfer' or 'Duit Now Transfer' → return 'DuitNow Transfer'\n" .
               "3. 'DuitNow Payment' or 'Duit Now Payment' → return 'DuitNow Payment'\n" .
               "4. 'DuitNow' or 'Duit Now' (generic) → return 'DuitNow Transfer'\n" .
               "5. 'Transfer' → return 'Transfer'\n" .
               "6. 'Payment' → return 'Payment'\n" .
               "7. If none found → return 'Transfer' (default)\n" .
               "IMPORTANT: Extract ONLY the type keyword, ignore recipient/merchant names\n\n" .
               "OUTPUT FORMAT (RETURN THIS EXACT STRUCTURE):\n" .
               "{\n" .
               '  "reference_id": "combined multi-line reference ID here",'."\n" .
               '  "date": "YYYY-MM-DD",'."\n" .
               '  "time": "HH:MM:SS",'."\n" .
               '  "amount": "numeric value only",'."\n" .
               '  "transaction_type": "one of the valid types above"'."\n" .
               "}\n\n" .
               "FINAL REMINDERS:\n" .
               "- Return ONLY the JSON object, NO other text\n" .
               "- Use null for missing fields\n" .
               "- DO NOT invent or make up data\n" .
               "- ALWAYS check the next line after reference ID for continuation numbers";
    }

    /**
     * Validate parsed data
     * 
     * @param array $data
     * @throws Exception
     */
    protected function validateParsedData($data)
    {
        $required = ['reference_id', 'date', 'time', 'amount'];
        // transaction_type is now optional with 'Transfer' as fallback from OpenAI
        
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                throw new Exception("Required field '{$field}' is missing or empty");
            }
        }
    }

}

