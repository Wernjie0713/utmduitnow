<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FacultySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faculties = [
            ['full_name' => 'Faculty of Civil Engineering', 'short_name' => 'FKA'],
            ['full_name' => 'Faculty of Chemical Engineering and Energy Engineering', 'short_name' => 'FKT'],
            ['full_name' => 'Faculty of Mechanical Engineering', 'short_name' => 'FKM'],
            ['full_name' => 'Faculty of Electrical Engineering', 'short_name' => 'FKE'],
            ['full_name' => 'Faculty of Computing', 'short_name' => 'FC'],
            ['full_name' => 'Faculty of Artificial Intelligence', 'short_name' => 'FAI'],
            ['full_name' => 'Faculty of Science', 'short_name' => 'FS'],
            ['full_name' => 'Faculty of Built Environment and Surveying', 'short_name' => 'FABU'],
            ['full_name' => 'Faculty of Social Sciences and Humanities', 'short_name' => 'FSSH'],
            ['full_name' => 'Faculty of Management', 'short_name' => 'FM'],
            ['full_name' => 'Malaysia-Japan International Institute of Technology', 'short_name' => 'MJIIT'],
            ['full_name' => 'Azman Hashim International Business School', 'short_name' => 'AHIBS'],
            ['full_name' => 'Faculty of Educational Sciences and Technology', 'short_name' => 'FEST'],
            ['full_name' => 'School of Professional and Continuing Education', 'short_name' => 'SPACE'],
        ];

        foreach ($faculties as $faculty) {
            \App\Models\Faculty::create($faculty);
        }

        $this->command->info('Faculties created successfully!');
    }
}
