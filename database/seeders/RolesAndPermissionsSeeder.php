<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Silber\Bouncer\BouncerFacade as Bouncer;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        Bouncer::role()->firstOrCreate([
            'name' => 'admin',
            'title' => 'Administrator',
        ]);

        Bouncer::role()->firstOrCreate([
            'name' => 'editor',
            'title' => 'Editor',
        ]);

        Bouncer::role()->firstOrCreate([
            'name' => 'user',
            'title' => 'Regular User',
        ]);

        // Create abilities (permissions)
        Bouncer::ability()->firstOrCreate([
            'name' => 'manage-users',
            'title' => 'Manage Users',
        ]);

        Bouncer::ability()->firstOrCreate([
            'name' => 'edit-posts',
            'title' => 'Edit Posts',
        ]);

        Bouncer::ability()->firstOrCreate([
            'name' => 'view-posts',
            'title' => 'View Posts',
        ]);

        Bouncer::ability()->firstOrCreate([
            'name' => 'delete-posts',
            'title' => 'Delete Posts',
        ]);

        // Assign abilities to roles
        Bouncer::allow('admin')->everything();
        Bouncer::allow('editor')->to(['edit-posts', 'view-posts']);
        Bouncer::allow('user')->to('view-posts');

        // Example: Assign roles to users (uncomment if you have users)
        // $adminUser = User::where('email', 'admin@example.com')->first();
        // if ($adminUser) {
        //     Bouncer::assign('admin')->to($adminUser);
        // }
    }
}
