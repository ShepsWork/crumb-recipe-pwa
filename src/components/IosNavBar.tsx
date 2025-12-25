import type { ReactNode } from 'react';

type Props = {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  /**
   * When true, renders a slightly taller bar to better match iOS large-title spacing.
   * (We still keep the title centered like a standard UINavigationBar.)
   */
  roomy?: boolean;
  className?: string;
};

/**
 * iOS-ish navigation bar (sticky, translucent, safe-area aware).
 *
 * Design goals:
 * - Keeps content out from under the notch/Dynamic Island
 * - Looks like a native nav bar (blur + subtle border)
 */
export function IosNavBar({ title, left, right, roomy, className }: Props) {
  return (
    <header
      className={[
        'ios-nav safe-top',
        'sticky top-0 z-40',
        'border-b border-black/5',
        roomy ? 'pt-2' : '',
        className || ''
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl',
          'px-4',
          // iOS nav bar height is 44pt; we approximate with padding.
          roomy ? 'pb-3' : 'pb-2',
          'pt-3'
        ].join(' ')}
      >
        <div className="relative flex items-center justify-between">
          <div className="min-w-[64px] flex items-center justify-start gap-2">{left}</div>

          <div className="pointer-events-none absolute left-0 right-0 flex justify-center">
            {title ? (
              <h1 className="ios-nav-title truncate px-20 text-[17px] font-semibold tracking-tight text-gray-900">
                {title}
              </h1>
            ) : null}
          </div>

          <div className="min-w-[64px] flex items-center justify-end gap-2">{right}</div>
        </div>
      </div>
    </header>
  );
}
