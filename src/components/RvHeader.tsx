import type { ReactNode } from 'react';
import { Menu, ArrowLeft } from 'lucide-react';

type Props = {
  /** Header title text */
  title: string;
  /** If true, show back arrow instead of hamburger (requires onBack) */
  showBackArrow?: boolean;
  /** Back arrow click handler */
  onBack?: () => void;
  /** Optional hamburger click handler (only used when showBackArrow is false) */
  onMenuOpen?: () => void;
  /** Optional right slot content (reserved 32px) */
  rightSlot?: ReactNode;
};

/**
 * Recipe Vault Header (deterministic per spec §12)
 * - Height: 72px (mobile) / 88px (tablet md:)
 * - Background: orange gradient top → bottom
 * - Left: hamburger 32px (or back arrow)
 * - Center: title white bold
 * - Right: reserved 32px slot (empty for now)
 * - Safe-area padding added on top
 */
export function RvHeader({ title, showBackArrow, onBack, onMenuOpen, rightSlot }: Props) {
  return (
    <header
      className="rv-header-gradient sticky top-0 z-40"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Mobile: 72px height, Tablet+: 88px */}
      <div className="h-[72px] md:h-[88px] flex items-center px-4 max-w-5xl mx-auto w-full">
        {/* Left slot: 32px */}
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          {showBackArrow && onBack ? (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="text-white hover:text-white/80"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : onMenuOpen ? (
            <button
              onClick={onMenuOpen}
              aria-label="Open navigation"
              className="text-white hover:text-white/80"
            >
              <Menu className="h-6 w-6" />
            </button>
          ) : (
            <span className="w-6 h-6" /> // empty placeholder
          )}
        </div>

        {/* Center: title */}
        <h1 className="flex-1 text-center text-white font-bold text-2xl md:text-3xl truncate px-2">
          {title}
        </h1>

        {/* Right slot: reserved 32px (empty for now per Q1=A) */}
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          {rightSlot || <span className="w-6 h-6" />}
        </div>
      </div>
    </header>
  );
}
