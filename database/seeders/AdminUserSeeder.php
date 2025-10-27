<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin already exists
        $existingAdmin = \App\Models\User::where('email', 'admin@utmduitnow.com')->first();
        
        if ($existingAdmin) {
            $this->command->warn('Admin user already exists. Skipping...');
            return;
        }

        // Get the first faculty or create a placeholder
        $faculty = \App\Models\Faculty::first();
        
        if (!$faculty) {
            $faculty = \App\Models\Faculty::create([
                'full_name' => 'Administration',
                'short_name' => 'ADMIN',
            ]);
        }

        $admin = \App\Models\User::create([
            'name' => 'System Administrator',
            'email' => 'admin@utmduitnow.com',
            'password' => bcrypt('password'),
            'matric_no' => 'ADMIN00000',
            'faculty_id' => $faculty->id,
            'year_of_study' => 1,
            'duitnow_id' => 'ADMIN_DUITNOW_ID',
            'email_verified_at' => now(),
            'profile_completed' => true,
            'phone_number' => '0123456789',
        ]);

        // Assign admin role
        \Bouncer::assign('admin')->to($admin);

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: admin@utmduitnow.com');
        $this->command->info('Password: password');
    }
}
