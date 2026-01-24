import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to manage screen wake lock for keeping the device awake.
 * Uses the Screen Wake Lock API when available.
 * 
 * @param enabled - Whether to enable the wake lock
 * @returns Object containing wake lock state and error info
 */
export function useWakeLock(enabled: boolean) {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if wake lock is supported
    setIsSupported('wakeLock' in navigator);
  }, []);

  useEffect(() => {
    if (!isSupported || !enabled) {
      // Release wake lock if it's active and we're disabling
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch((err) => {
          console.warn('Failed to release wake lock:', err);
        });
        wakeLockRef.current = null;
        setIsActive(false);
      }
      return;
    }

    let mounted = true;
    const enabledRef: { current: boolean } = { current: enabled };

    const requestWakeLock = async () => {
      try {
        // Request a screen wake lock
        const wakeLock = await navigator.wakeLock.request('screen');
        
        if (!mounted) {
          // Component unmounted, release immediately
          wakeLock.release();
          return;
        }

        wakeLockRef.current = wakeLock;
        setIsActive(true);
        setError(null);

        // Listen for wake lock release
        wakeLock.addEventListener('release', () => {
          if (mounted) {
            setIsActive(false);
          }
        });

      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to acquire wake lock';
          setError(errorMessage);
          setIsActive(false);
          console.warn('Wake lock request failed:', err);
        }
      }
    };

    // Request wake lock
    requestWakeLock();

    // Re-request wake lock when document becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabledRef.current && !wakeLockRef.current) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      mounted = false;
      enabledRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch((err) => {
          console.warn('Failed to release wake lock on cleanup:', err);
        });
        wakeLockRef.current = null;
      }
    };
  }, [enabled, isSupported]);

  return {
    isSupported,
    isActive,
    error
  };
}
