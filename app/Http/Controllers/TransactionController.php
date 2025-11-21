<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\TransactionVerificationService;
use App\Helpers\CompetitionWeekHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    protected $verificationService;

    public function __construct(TransactionVerificationService $verificationService)
    {
        $this->verificationService = $verificationService;
    }

    /**
     * Show the transaction submission page
     */
    public function index()
    {
        $user = auth()->user();
        $todaySubmissions = $user->getTodaySubmissionCount();
        $maxSubmissions = config('app.max_submissions_per_day', 100);
        $canSubmit = $user->canSubmitToday();
        
        // Check if we're in Week 3 extended submission period
        $isExtendedPeriod = CompetitionWeekHelper::isInWeek3ExtendedSubmissionPeriod();

        return Inertia::render('Transactions/Submit', [
            'todaySubmissions' => $todaySubmissions,
            'maxSubmissions' => $maxSubmissions,
            'canSubmit' => $canSubmit,
            'isExtendedPeriod' => $isExtendedPeriod,
            'extendedSubmissionEnd' => $isExtendedPeriod 
                ? CompetitionWeekHelper::getWeek3ExtendedSubmissionEndString() 
                : null,
        ]);
    }

    /**
     * Preview transaction without saving to database
     */
    public function preview(Request $request)
    {
        $request->validate([
            'receipt_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $previewData = $this->verificationService->preview(
            $request->file('receipt_image'),
            auth()->id()
        );

        return response()->json($previewData);
    }

    /**
     * Store a new transaction submission
     */
    public function store(Request $request)
    {
        // Check if this is a confirmed submission with preview data
        if ($request->has('preview_data')) {
            $previewData = $request->input('preview_data');
            
            try {
                $transaction = $this->verificationService->submitVerifiedData(
                    $previewData,
                    auth()->id()
                );

                return redirect()->back()->with('success', 'Transaction approved! Your submission has been added to the leaderboard.');
            } catch (\Exception $e) {
                return redirect()->back()->with('error', 'Failed to submit transaction. Please try again.');
            }
        }

        // Fallback to direct verification (for backward compatibility)
        $request->validate([
            'receipt_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $user = auth()->user();

        // Verify the transaction
        $transaction = $this->verificationService->verify(
            $request->file('receipt_image'),
            $user->id
        );

        if ($transaction->status === 'approved') {
            return redirect()->back()->with('success', 'Transaction approved! Your submission has been added to the leaderboard.');
        } else {
            return redirect()->back()->with('error', $transaction->rejection_reason);
        }
    }

    /**
     * Show user's transaction history
     */
    public function myTransactions(Request $request)
    {
        $query = Transaction::where('user_id', auth()->id())
            // Exclude October data
            ->where(function($q) {
                $q->whereMonth('transaction_date', '!=', 10)
                  ->orWhereNull('transaction_date');
            });
        
        // Global search (Reference ID and Amount)
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference_id', 'like', "%{$search}%")
                  ->orWhere('amount', 'like', "%{$search}%");
            });
        }
        
        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination with customizable per_page
        $perPage = $request->input('per_page', 10);
        $perPage = in_array($perPage, [10, 20, 30, 50, 100]) ? $perPage : 10;
        
        $transactions = $query->paginate($perPage)->withQueryString();
        
        // Check if we're in Week 3 extended submission period
        $isExtendedPeriod = \App\Helpers\CompetitionWeekHelper::isInWeek3ExtendedSubmissionPeriod();
        
        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'filters' => [
                'search' => $request->search,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
            'isExtendedPeriod' => $isExtendedPeriod,
            'extendedSubmissionEnd' => $isExtendedPeriod 
                ? \App\Helpers\CompetitionWeekHelper::getWeek3ExtendedSubmissionEndString() 
                : null,
        ]);
    }

    /**
     * Show a single transaction
     */
    public function show($id)
    {
        $transaction = Transaction::where('id', $id)
            ->where('user_id', auth()->id())
            ->with('user')
            ->firstOrFail();

        return Inertia::render('Transactions/Show', [
            'transaction' => $transaction,
        ]);
    }
}
