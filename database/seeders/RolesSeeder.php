<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles using Bouncer
        \Bouncer::allow('admin')->everything();
        
        \Bouncer::allow('student')->to('submit-transaction');
        \Bouncer::allow('student')->to('view-own-transactions');
        \Bouncer::allow('student')->to('view-leaderboard');
        
        $this->command->info('Roles and abilities created successfully!');
    }
}
