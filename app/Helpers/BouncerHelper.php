<?php

namespace App\Helpers;

use Silber\Bouncer\BouncerFacade as Bouncer;
use App\Models\User;

/**
 * Helper class for common Bouncer operations
 * 
 * This helper provides convenient methods for role and permission management
 */
class BouncerHelper
{
    /**
     * Assign a role to a user
     *
     * @param User $user
     * @param string|array $roles
     * @return void
     */
    public static function assignRole(User $user, string|array $roles): void
    {
        if (is_array($roles)) {
            foreach ($roles as $role) {
                Bouncer::assign($role)->to($user);
            }
        } else {
            Bouncer::assign($roles)->to($user);
        }
        
        Bouncer::refresh($user);
    }

    /**
     * Remove a role from a user
     *
     * @param User $user
     * @param string|array $roles
     * @return void
     */
    public static function removeRole(User $user, string|array $roles): void
    {
        if (is_array($roles)) {
            foreach ($roles as $role) {
                Bouncer::retract($role)->from($user);
            }
        } else {
            Bouncer::retract($roles)->from($user);
        }
        
        Bouncer::refresh($user);
    }

    /**
     * Grant an ability to a user
     *
     * @param User $user
     * @param string|array $abilities
     * @return void
     */
    public static function grantAbility(User $user, string|array $abilities): void
    {
        if (is_array($abilities)) {
            Bouncer::allow($user)->to($abilities);
        } else {
            Bouncer::allow($user)->to($abilities);
        }
        
        Bouncer::refresh($user);
    }

    /**
     * Revoke an ability from a user
     *
     * @param User $user
     * @param string|array $abilities
     * @return void
     */
    public static function revokeAbility(User $user, string|array $abilities): void
    {
        if (is_array($abilities)) {
            foreach ($abilities as $ability) {
                Bouncer::disallow($user)->to($ability);
            }
        } else {
            Bouncer::disallow($user)->to($abilities);
        }
        
        Bouncer::refresh($user);
    }

    /**
     * Check if user has any of the given roles
     *
     * @param User $user
     * @param string|array $roles
     * @return bool
     */
    public static function hasRole(User $user, string|array $roles): bool
    {
        if (is_array($roles)) {
            return $user->isAn(...$roles);
        }
        
        return $user->isA($roles);
    }

    /**
     * Check if user has all of the given roles
     *
     * @param User $user
     * @param array $roles
     * @return bool
     */
    public static function hasAllRoles(User $user, array $roles): bool
    {
        return $user->isAll(...$roles);
    }

    /**
     * Get all roles for a user
     *
     * @param User $user
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getUserRoles(User $user)
    {
        return $user->roles;
    }

    /**
     * Get all abilities for a user
     *
     * @param User $user
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getUserAbilities(User $user)
    {
        return $user->abilities;
    }

    /**
     * Sync roles for a user (remove all existing and assign new ones)
     *
     * @param User $user
     * @param array $roles
     * @return void
     */
    public static function syncRoles(User $user, array $roles): void
    {
        // Remove all existing roles
        $existingRoles = $user->roles->pluck('name')->toArray();
        foreach ($existingRoles as $role) {
            Bouncer::retract($role)->from($user);
        }
        
        // Assign new roles
        self::assignRole($user, $roles);
    }

    /**
     * Check if a role exists
     *
     * @param string $roleName
     * @return bool
     */
    public static function roleExists(string $roleName): bool
    {
        return Bouncer::role()->where('name', $roleName)->exists();
    }

    /**
     * Check if an ability exists
     *
     * @param string $abilityName
     * @return bool
     */
    public static function abilityExists(string $abilityName): bool
    {
        return Bouncer::ability()->where('name', $abilityName)->exists();
    }

    /**
     * Create a new role
     *
     * @param string $name
     * @param string|null $title
     * @return \Silber\Bouncer\Database\Role
     */
    public static function createRole(string $name, ?string $title = null)
    {
        return Bouncer::role()->firstOrCreate([
            'name' => $name,
            'title' => $title ?? ucfirst($name),
        ]);
    }

    /**
     * Create a new ability
     *
     * @param string $name
     * @param string|null $title
     * @return \Silber\Bouncer\Database\Ability
     */
    public static function createAbility(string $name, ?string $title = null)
    {
        return Bouncer::ability()->firstOrCreate([
            'name' => $name,
            'title' => $title ?? ucwords(str_replace('-', ' ', $name)),
        ]);
    }
}

