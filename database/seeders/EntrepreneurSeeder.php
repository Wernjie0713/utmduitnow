<?php

namespace Database\Seeders;

use App\Models\EntrepreneurDuitnowId;
use App\Models\EntrepreneurTeamMember;
use App\Models\EntrepreneurUnit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Silber\Bouncer\BouncerFacade as Bouncer;

class EntrepreneurSeeder extends Seeder
{
    public function run(): void
    {
        // --- Shop account (shared login for the whole team) ---
        $shopUser = User::firstOrCreate(
            ['email' => 'shop@utmduitnow.com'],
            [
                'name' => 'UTM BYTE CAFE',
                'password' => Hash::make('password'),
                'matric_no' => 'SHOP00001',
                'faculty_id' => \App\Models\Faculty::first()?->id ?? 1,
                'year_of_study' => 1,
                'duitnow_id' => '0199876543',
                'phone_number' => '0199876543',
                'email_verified_at' => now(),
                'profile_completed' => true,
            ]
        );
        Bouncer::assign('shop')->to($shopUser);

        // --- Business Unit ---
        $unit = EntrepreneurUnit::firstOrCreate(
            ['manager_id' => $shopUser->id],
            [
                'business_name' => 'UTM Byte Cafe',
                'business_location' => 'physical',
                'course_code' => 'SECJ3104',
                'section' => '01',
            ]
        );

        // --- Team members (text-based, no user accounts) ---
        $members = [
            ['member_name' => 'NUR AISYAH BINTI AHMAD', 'matric_no' => 'A22EC0002'],
            ['member_name' => 'LIM WEI MING', 'matric_no' => 'A22EC0003'],
        ];

        foreach ($members as $member) {
            EntrepreneurTeamMember::firstOrCreate(
                [
                    'entrepreneur_unit_id' => $unit->id,
                    'matric_no' => $member['matric_no'],
                ],
                ['member_name' => $member['member_name']]
            );
        }

        // --- DuitNow ID for the unit ---
        EntrepreneurDuitnowId::firstOrCreate(
            ['entrepreneur_unit_id' => $unit->id, 'duitnow_id' => '0191234567'],
        );

        $this->command->info('Entrepreneur demo data seeded!');
        $this->command->info('Login: shop@utmduitnow.com / password');
        $this->command->info('Business: UTM Byte Cafe (physical) — SECJ3104 Section 01');
    }
}
