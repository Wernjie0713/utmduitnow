<?php

namespace App\Http\Controllers;

use App\Models\EntrepreneurUnit;
use App\Models\EntrepreneurDuitnowId;
use App\Models\EntrepreneurTeamMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EntrepreneurUnitController extends Controller
{

    public function edit()
    {
        $unit = Auth::user()->entrepreneurUnit->load('teamMembers', 'duitnowIds');

        return Inertia::render('Entrepreneur/Profile', [
            'unit' => $unit,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'business_location' => 'required|in:online,physical',
            'course_code' => 'required|string|max:255',
            'section' => 'required|string|max:255',
        ]);

        $unit = Auth::user()->entrepreneurUnit;
        $unit->update($request->only('business_name', 'business_location', 'course_code', 'section'));

        return redirect()->back()->with('success', 'Business details updated.');
    }

    public function addTeamMember(Request $request)
    {
        $request->validate([
            'member_name' => 'required|string|max:255',
            'matric_no' => 'required|string|max:255',
        ]);

        $unit = Auth::user()->entrepreneurUnit;

        $unit->teamMembers()->create([
            'member_name' => $request->member_name,
            'matric_no' => $request->matric_no,
        ]);

        return redirect()->back()->with('success', 'Team member added.');
    }

    public function removeTeamMember($id)
    {
        $unit = Auth::user()->entrepreneurUnit;
        $unit->teamMembers()->where('id', $id)->delete();

        return redirect()->back()->with('success', 'Team member removed.');
    }

    public function addDuitnowId(Request $request)
    {
        $request->validate([
            'duitnow_id' => 'required|string|max:255',
        ]);

        $unit = Auth::user()->entrepreneurUnit;
        $unit->duitnowIds()->create(['duitnow_id' => $request->duitnow_id]);

        return redirect()->back()->with('success', 'DuitNow ID added.');
    }

    public function removeDuitnowId($id)
    {
        $unit = Auth::user()->entrepreneurUnit;
        $unit->duitnowIds()->where('id', $id)->delete();

        return redirect()->back()->with('success', 'DuitNow ID removed.');
    }
}
