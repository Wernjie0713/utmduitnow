<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EntrepreneurUnit;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;

class EntrepreneurDataController extends Controller
{
    public function viewUnits(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        $query = EntrepreneurUnit::with(['manager', 'teamMembers', 'duitnowIds'])
            ->withCount('teamMembers', 'duitnowIds', 'transactions');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'like', "%{$search}%")
                    ->orWhere('course_code', 'like', "%{$search}%")
                    ->orWhereHas('manager', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $units = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Entrepreneur/Units', [
            'units' => $units,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function exportUnits(Request $request)
    {
        $search = $request->input('search');

        $query = EntrepreneurUnit::with(['manager', 'teamMembers', 'duitnowIds'])
            ->withCount('teamMembers', 'duitnowIds', 'transactions');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'like', "%{$search}%")
                    ->orWhere('course_code', 'like', "%{$search}%")
                    ->orWhereHas('manager', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $units = $query->latest()->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=entrepreneur_units_" . date('Y-m-d_His') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function () use ($units) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Business Name',
                'Business Type',
                'Course Code',
                'Section',
                'Manager Name',
                'Manager Email',
                'Team Members',
                'DuitNow IDs'
            ]);

            foreach ($units as $unit) {
                $teamMembers = $unit->teamMembers->pluck('member_name')->implode(', ');
                $duitnowIds = $unit->duitnowIds->pluck('duitnow_id')->implode(', ');

                fputcsv($file, [
                    $unit->business_name,
                    ucfirst($unit->business_location),
                    $unit->course_code,
                    $unit->section,
                    $unit->manager ? $unit->manager->name : 'N/A',
                    $unit->manager ? $unit->manager->email : 'N/A',
                    $teamMembers ?: 'None',
                    $duitnowIds ?: 'None'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
