import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';

describe('useWakeLock', () => {
  let mockWakeLockSentinel: any;
  let mockNavigator: any;

  beforeEach(() => {
    // Create a mock WakeLockSentinel
    mockWakeLockSentinel = {
      released: false,
      type: 'screen',
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Mock navigator.wakeLock
    mockNavigator = {
      wakeLock: {
        request: vi.fn().mockResolvedValue(mockWakeLockSentinel),
      },
    };

    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('detects wake lock support', async () => {
    const { result } = renderHook(() => useWakeLock(false));

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });
  });

  it('does not detect wake lock support when unavailable', async () => {
    // Remove wakeLock from navigator
    delete (navigator as any).wakeLock;

    const { result } = renderHook(() => useWakeLock(false));

    await waitFor(() => {
      expect(result.current.isSupported).toBe(false);
    });
  });

  it('requests wake lock when enabled', async () => {
    const { result } = renderHook(() => useWakeLock(true));

    await waitFor(() => {
      expect(mockNavigator.wakeLock.request).toHaveBeenCalledWith('screen');
      expect(result.current.isActive).toBe(true);
    });
  });

  it('does not request wake lock when disabled', async () => {
    const { result } = renderHook(() => useWakeLock(false));

    await waitFor(() => {
      expect(mockNavigator.wakeLock.request).not.toHaveBeenCalled();
      expect(result.current.isActive).toBe(false);
    });
  });

  it('releases wake lock when enabled changes to false', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useWakeLock(enabled),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => {
      expect(result.current.isActive).toBe(true);
    });

    // Disable wake lock
    rerender({ enabled: false });

    await waitFor(() => {
      expect(mockWakeLockSentinel.release).toHaveBeenCalled();
    });
  });

  it('handles wake lock request errors gracefully', async () => {
    const error = new Error('Wake lock denied');
    mockNavigator.wakeLock.request.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useWakeLock(true));

    await waitFor(() => {
      expect(result.current.isActive).toBe(false);
      expect(result.current.error).toBe('Wake lock denied');
    });
  });

  it('does not activate wake lock when not supported', async () => {
    delete (navigator as any).wakeLock;

    const { result } = renderHook(() => useWakeLock(true));

    await waitFor(() => {
      expect(result.current.isSupported).toBe(false);
      expect(result.current.isActive).toBe(false);
    });
  });

  it('releases wake lock on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));

    await waitFor(() => {
      expect(mockNavigator.wakeLock.request).toHaveBeenCalled();
    });

    unmount();

    await waitFor(() => {
      expect(mockWakeLockSentinel.release).toHaveBeenCalled();
    });
  });
});
