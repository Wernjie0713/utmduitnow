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
                'model' => 'gpt-5-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert at extracting structured data from transaction receipts. Always respond with valid JSON only, no additional text.'
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
        return "Extract the following information from this DuitNow transaction receipt and return ONLY valid JSON:\n\n" .
               "OCR Text:\n{$ocrText}\n\n" .
               "Extract and return in this exact JSON format:\n" .
               "{\n" .
               '  "reference_id": "the unique reference or transaction ID",'."\n" .
               '  "date": "YYYY-MM-DD format",'."\n" .
               '  "time": "HH:MM:SS format (24-hour)",'."\n" .
               '  "amount": "numeric value only, without currency symbol",'."\n" .
               '  "transaction_type": "transaction type (e.g., Transfer, Payment, DuitNow Transfer, DuitNow Payment, DuitNow QR)"'."\n" .
               "}\n\n" .
               "Rules:\n" .
               "- If any field cannot be found, use null\n" .
               "- Amount should be a decimal number\n" .
               "- Date must be in YYYY-MM-DD format\n" .
               "- Time must be in HH:MM:SS format\n" .
               "- If transaction_type cannot be found, use 'Transfer' as default\n" .
               "- Return ONLY the JSON object, no other text\n" .
               "- DO NOT make up or invent data - only extract what is clearly visible\n\n" .
               "CRITICAL Instructions for DATE PARSING (MALAYSIA FORMAT):\n" .
               "- IMPORTANT: This receipt uses MALAYSIAN date format (DD/MM/YYYY)\n" .
               "- When you see a date like '01/11/2025', it means 1 November 2025, NOT 11 January 2025\n" .
               "- Always interpret DD/MM/YYYY format: Day/Month/Year\n" .
               "- Convert Malaysian dates to YYYY-MM-DD format (e.g., '01/11/2025' becomes '2025-11-01')\n" .
               "- If month is written in text (e.g., '01 Nov 2025'), interpret correctly as 1 November 2025\n" .
               "- If month is written as number (e.g., '01/11/2025'), treat as DD/MM/YYYY format\n" .
               "- Malaysian dates NEVER use MM/DD/YYYY format - always DD/MM/YYYY\n\n" .
               "CRITICAL Instructions for reference_id:\n" .
               "- Look for 'Reference No.' first as the PRIMARY reference ID\n" .
               "- If 'Reference No.' exists, use that value and IGNORE 'DuitNow Ref No.'\n" .
               "- Only use 'DuitNow Ref No.' if 'Reference No.' is not found\n" .
               "- Also check for 'Ref No.', 'DuitNow Reference No.', 'Transaction ID', or similar labels\n" .
               "- The reference ID may span multiple lines - combine all lines to form complete reference ID\n" .
               "- IMPORTANT: When reference ID is too long, it often wraps to the next line with a short number (2-3 digits)\n" .
               "- If you see a very short number (like '159', '234', etc.) immediately after the main reference ID on the next line, ALWAYS combine them\n" .
               "- Example: 'Reference ID 20251101RHBBMYKL040OQR55596\\n159' becomes '20251101RHBBMYKL040OQR55596159'\n" .
               "- Example: 'Reference ID ABC123DEF456\\n789' becomes 'ABC123DEF456789'\n" .
               "- Remove any spaces or line breaks to form a single continuous reference ID\n" .
               "- IMPORTANT: If NO reference number is found, return null - DO NOT make up or invent a reference ID\n" .
               "- DO NOT use transaction date, time, or amount as reference ID\n\n" .
               "CRITICAL Instructions for transaction_type:\n" .
               "- Look for transaction type labels in the receipt text\n" .
               "- Valid transaction types: 'DuitNow Transfer', 'DuitNow Payment', 'DuitNow QR', 'Transfer', 'Payment'\n" .
               "- PRIORITY ORDER: Check for 'DuitNow' variations FIRST before falling back to generic types\n" .
               "- If you see 'DuitNow Transfer' or 'Duit Now Transfer', use 'DuitNow Transfer'\n" .
               "- If you see 'DuitNow Payment' or 'Duit Now Payment', use 'DuitNow Payment'\n" .
               "- If you see 'DuitNow QR' or 'Duit Now QR', use 'DuitNow QR'\n" .
               "- If you see 'DuitNow' or 'Duit Now' WITHOUT specific type, use 'DuitNow Transfer'\n" .
               "- Extract ONLY the transaction type keyword - DO NOT include recipient or merchant names\n" .
               "- If you see 'Transfer to [merchant name]', extract ONLY 'Transfer' (ignore everything after 'to')\n" .
               "- If you see 'Payment to [merchant name]', extract ONLY 'Payment' (ignore everything after 'to')\n" .
               "- If no clear transaction type is found, use 'Transfer' as default";
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

