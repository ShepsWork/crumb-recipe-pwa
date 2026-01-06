/**
 * Profile Manager - manages user profiles and profile switching.
 * 
 * Stores profile registry in localStorage and provides APIs for
 * creating, listing, and switching between profiles.
 */

import type { Profile, ProfileRegistry } from '../types';
import type { UserId } from '../identity/identity';

const PROFILE_REGISTRY_KEY = 'crumbworks.profiles.registry';
const ACTIVE_PROFILE_KEY = 'crumbworks.profiles.active';

/**
 * Get the profile registry from localStorage
 */
function getRegistry(): ProfileRegistry {
  try {
    const stored = localStorage.getItem(PROFILE_REGISTRY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ProfileRegistry;
      return parsed;
    }
  } catch (error) {
    console.error('Failed to read profile registry:', error);
  }
  
  // Default empty registry
  return {
    profiles: [],
    activeUserId: null
  };
}

/**
 * Save the profile registry to localStorage
 */
function saveRegistry(registry: ProfileRegistry): void {
  try {
    localStorage.setItem(PROFILE_REGISTRY_KEY, JSON.stringify(registry));
  } catch (error) {
    console.error('Failed to save profile registry:', error);
  }
}

/**
 * List all registered profiles
 */
export function listProfiles(): Profile[] {
  const registry = getRegistry();
  return [...registry.profiles];
}

/**
 * Get the active profile userId
 */
export function getActiveProfileId(): UserId | null {
  try {
    const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return stored || null;
  } catch (error) {
    console.error('Failed to read active profile:', error);
    return null;
  }
}

/**
 * Get the active profile object
 */
export function getActiveProfile(): Profile | null {
  const activeId = getActiveProfileId();
  if (!activeId) return null;
  
  const registry = getRegistry();
  return registry.profiles.find(p => p.userId === activeId) || null;
}

/**
 * Set the active profile
 */
export function setActiveProfile(userId: UserId): void {
  const registry = getRegistry();
  
  // Verify profile exists
  const profile = registry.profiles.find(p => p.userId === userId);
  if (!profile) {
    throw new Error(`Profile not found: ${userId}`);
  }
  
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, userId);
    
    // Also update in registry for consistency
    registry.activeUserId = userId;
    saveRegistry(registry);
  } catch (error) {
    console.error('Failed to set active profile:', error);
    throw error;
  }
}

/**
 * Create a new profile
 */
export function createProfile(userId: UserId, label?: string): Profile {
  const registry = getRegistry();
  
  // Check if profile already exists
  const existing = registry.profiles.find(p => p.userId === userId);
  if (existing) {
    return existing;
  }
  
  // Create new profile
  const profile: Profile = {
    userId,
    label: label || `Profile ${registry.profiles.length + 1}`,
    createdAt: Date.now()
  };
  
  registry.profiles.push(profile);
  saveRegistry(registry);
  
  return profile;
}

/**
 * Update a profile's label
 */
export function updateProfileLabel(userId: UserId, newLabel: string): void {
  const registry = getRegistry();
  const profile = registry.profiles.find(p => p.userId === userId);
  
  if (!profile) {
    throw new Error(`Profile not found: ${userId}`);
  }
  
  profile.label = newLabel;
  saveRegistry(registry);
}

/**
 * Delete a profile from the registry.
 * Note: This does NOT delete the profile's data from IndexedDB.
 */
export function deleteProfile(userId: UserId): void {
  const registry = getRegistry();
  
  // Don't allow deleting the active profile
  if (registry.activeUserId === userId) {
    throw new Error('Cannot delete the active profile. Switch to another profile first.');
  }
  
  registry.profiles = registry.profiles.filter(p => p.userId !== userId);
  saveRegistry(registry);
}

/**
 * Get a profile by userId
 */
export function getProfile(userId: UserId): Profile | null {
  const registry = getRegistry();
  return registry.profiles.find(p => p.userId === userId) || null;
}

/**
 * Initialize the profile system with a default profile.
 * This should be called during app initialization.
 */
export function ensureDefaultProfile(userId: UserId): Profile {
  const registry = getRegistry();
  
  // If registry is empty, this is first run
  if (registry.profiles.length === 0) {
    const profile = createProfile(userId, 'My Profile');
    setActiveProfile(userId);
    return profile;
  }
  
  // If no active profile, set the first one
  if (!registry.activeUserId && registry.profiles.length > 0) {
    setActiveProfile(registry.profiles[0].userId);
  }
  
  // Return or create profile
  const profile = getProfile(userId);
  if (profile) {
    return profile;
  }
  
  return createProfile(userId);
}
