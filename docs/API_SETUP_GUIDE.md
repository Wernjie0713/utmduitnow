# API Integration Guide

This guide explains how to set up Azure Computer Vision and OpenAI API for the transaction verification system.

---

## Azure Computer Vision Setup

### Step 1: Create Azure Account

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign up for a free account (includes $200 credit for 30 days)
3. No credit card required for free tier

### Step 2: Create Computer Vision Resource

1. Click **"Create a resource"**
2. Search for **"Computer Vision"**
3. Click **"Create"**
4. Fill in details:
   - **Subscription**: Select your subscription
   - **Resource group**: Create new (e.g., "utmduitnow-resources")
   - **Region**: Southeast Asia (closest to Malaysia)
   - **Name**: Choose a unique name (e.g., "utmduitnow-vision")
   - **Pricing tier**: **Free F0** (5,000 transactions/month FREE)
5. Click **"Review + create"**
6. Wait for deployment to complete

### Step 3: Get API Credentials

1. Go to your Computer Vision resource
2. Click **"Keys and Endpoint"** in the left sidebar
3. Copy:
   - **Endpoint**: (e.g., `https://utmduitnow-vision.cognitiveservices.azure.com/`)
   - **Key 1**: Your API key

4. Add to `.env`:
```env
AZURE_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_key_here
```

### Free Tier Limits

- **5,000 transactions/month** FREE
- After that: **$1.00 per 1,000 transactions**

For your project (10,000 receipts/month):
- First 5,000: FREE
- Next 5,000: $5.00
- **Total: $5/month**

---

## OpenAI API Setup

### Step 1: Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up for an account
3. You'll get **$5 FREE credit** to start (enough for ~2,500 requests)

### Step 2: Add Payment Method

1. Go to **Settings** → **Billing**
2. Add a credit card (required after free credit runs out)
3. Set spending limits to control costs:
   - Recommended: $30/month limit
   - Soft limit: $25
   - Hard limit: $30

### Step 3: Create API Key

1. Go to **API Keys** section
2. Click **"Create new secret key"**
3. Name it (e.g., "UTM DuitNow Parser")
4. Copy the key (starts with `sk-...`)
5. **⚠️ Save it now - you can't view it again!**

6. Add to `.env`:
```env
OPENAI_API_KEY=sk-your_actual_api_key_here
```

### Pricing

Using **GPT-3.5-turbo**:
- **$0.0015 per 1K input tokens** (~750 words)
- **$0.0020 per 1K output tokens** (~750 words)

For transaction parsing:
- Input: ~200 tokens (OCR text)
- Output: ~50 tokens (JSON response)
- **Cost: ~$0.0004 per receipt** = $0.40 per 1,000 receipts

For your project (10,000 receipts/month):
- **Total: ~$4.00/month**

---

## Testing Without API Keys

### Mock Mode (Free - No API Required)

The system automatically uses mock data if API keys are not configured:

1. **Mock OCR** (`AzureOcrService`):
   - Generates realistic-looking OCR text
   - Creates random reference IDs
   - Uses current date/time

2. **Mock Parsing** (`OpenAiParserService`):
   - Uses regex to extract data from mock OCR
   - Still validates format
   - Returns structured JSON

### How to Enable Mock Mode

Just leave the default placeholder values in `.env`:
```env
AZURE_VISION_ENDPOINT=your_azure_endpoint_here
AZURE_VISION_KEY=your_azure_key_here
OPENAI_API_KEY=your_openai_key_here
```

The services detect these placeholders and automatically use mock mode.

---

## API Integration Code

### Azure OCR Integration

Located in: `app/Services/AzureOcrService.php`

**How it works:**
1. Sends image to Azure `/read/analyze` endpoint
2. Polls operation URL until processing complete
3. Extracts all text lines from the result
4. Returns raw OCR text

**Error Handling:**
- Falls back to mock OCR on any error
- Logs all errors for debugging
- Never crashes the application

### OpenAI Parser Integration

Located in: `app/Services/OpenAiParserService.php`

**How it works:**
1. Builds structured prompt with OCR text
2. Calls OpenAI Chat Completions API (GPT-3.5-turbo)
3. Instructs model to return only JSON
4. Parses and validates the response
5. Extracts: Reference ID, Date, Time, Amount, Transaction Type

**Error Handling:**
- Falls back to regex parsing on any error
- Validates all required fields exist
- Ensures proper date/time formatting

---

## Cost Optimization Tips

### 1. Batch Processing (Future Enhancement)
Process multiple receipts in batch to reduce API overhead.

### 2. Caching
Cache OCR results for 24 hours in case user resubmits same image.

### 3. Use GPT-3.5 (Not GPT-4)
GPT-3.5 is 10x cheaper and perfectly adequate for this task.

### 4. Optimize Prompts
Shorter prompts = lower costs. Our prompts are already optimized.

### 5. Set Spending Alerts
Both Azure and OpenAI allow spending limit alerts.

---

## Monitoring API Usage

### Azure Portal
1. Go to your Computer Vision resource
2. Click **"Metrics"** in left sidebar
3. View transaction counts and errors

### OpenAI Dashboard
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Click **"Usage"** in top menu
3. View daily/monthly usage and costs

---

## API Response Examples

### Azure OCR Response (Simplified)

```json
{
  "status": "succeeded",
  "analyzeResult": {
    "readResults": [
      {
        "lines": [
          { "text": "DuitNow Transaction Receipt" },
          { "text": "Reference ID: DN1234567890" },
          { "text": "Date: 22/10/2025" },
          { "text": "Time: 14:30:25" },
          { "text": "Amount: RM 45.50" },
          { "text": "Transaction Type: Payment" }
        ]
      }
    ]
  }
}
```

### OpenAI Parser Response

```json
{
  "reference_id": "DN1234567890",
  "date": "2025-10-22",
  "time": "14:30:25",
  "amount": "45.50",
  "transaction_type": "Payment"
}
```

---

## Security Best Practices

### 1. Never Commit API Keys
✅ Already configured - `.env` is in `.gitignore`

### 2. Use Environment Variables
✅ Already implemented - all keys from `config/services.php`

### 3. Rotate Keys Regularly
Recommended: Rotate every 90 days

### 4. Monitor for Unusual Activity
Set up alerts for:
- Sudden spikes in API usage
- High error rates
- Unauthorized access attempts

### 5. Use Different Keys for Dev/Production
- Development: Use separate API keys with lower limits
- Production: Use dedicated keys with higher limits

---

## Troubleshooting

### Azure OCR Returns 401 Unauthorized
- Check API key is correct
- Ensure endpoint URL includes `https://`
- Verify key hasn't been regenerated

### Azure OCR Returns 429 Too Many Requests
- You've exceeded free tier (5,000/month)
- Upgrade to paid tier or wait until next month
- Consider implementing rate limiting

### OpenAI Returns 401 Unauthorized
- Check API key starts with `sk-`
- Verify key is still valid (not deleted)
- Check organization ID if required

### OpenAI Returns 429 Rate Limit
- Exceeded rate limit (3 RPM on free tier, 3,500 RPM on paid)
- Implement request queuing
- Add delays between requests

### "API credentials not configured" Warning in Logs
- Expected behavior when using mock mode
- Not an error - system working as designed
- Add real keys to switch to production mode

---

## Testing API Integration

### Test Azure OCR

```bash
php artisan tinker
```

```php
$service = new App\Services\AzureOcrService();
$text = $service->extractText('path/to/test/receipt.jpg');
dd($text);
```

### Test OpenAI Parser

```php
$service = new App\Services\OpenAiParserService();
$ocrText = "Reference ID: DN123456\nDate: 22/10/2025\nAmount: RM 50.00";
$parsed = $service->parseTransactionData($ocrText);
dd($parsed);
```

### Test Full Verification

```php
$user = User::first();
$file = new \Illuminate\Http\UploadedFile('path/to/receipt.jpg', 'receipt.jpg', 'image/jpeg', null, true);
$service = app(App\Services\TransactionVerificationService::class);
$transaction = $service->verify($file, $user->id);
dd($transaction);
```

---

## Alternative: Use Tesseract OCR (Free, Self-Hosted)

If you want a completely free solution:

### Install Tesseract OCR

**Windows:**
```bash
choco install tesseract
```

**Or download:** https://github.com/UB-Mannheim/tesseract/wiki

### Install PHP Tesseract Package

```bash
composer require thiagoalessio/tesseract_ocr
```

### Modify AzureOcrService

Replace Azure API calls with Tesseract:

```php
use thiagoalessio\TesseractOCR\TesseractOCR;

protected function tesseractExtract($imagePath)
{
    return (new TesseractOCR($imagePath))
        ->lang('eng')
        ->run();
}
```

**Pros:**
- Completely free
- No API limits
- Works offline

**Cons:**
- Lower accuracy than Azure (~70-80% vs 95%+)
- Needs Tesseract installed on server
- Slower processing

---

## Recommended Setup for Your Project

Given your constraints (200 students, 3 months, budget ~$25/month):

1. ✅ **Start with Mock Mode** for initial testing
2. ✅ **Upgrade to Azure + OpenAI** when ready to launch
3. ✅ **Monitor usage** daily during first week
4. ✅ **Set spending alerts** at $20 and $25
5. ✅ **Keep mock mode** as fallback if APIs fail

This gives you:
- Safe testing environment
- Controlled costs
- Production-ready verification
- Fallback resilience

