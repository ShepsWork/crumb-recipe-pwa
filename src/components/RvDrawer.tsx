import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const menuItems = [
  { to: '/library', label: 'Recipes' },
  { to: '/settings', label: 'Settings' },
  { to: '/about', label: 'About' },
];

/**
 * Recipe Vault Navigation Drawer / Sidebar (deterministic per spec §14)
 * - Mobile (<768px): slide-in 280px
 * - Tablet+ (>=768px): fixed sidebar 320px
 * - Background: #2C3E50
 * - Active item: 6px left bar #F7D774, background rgba(247,215,116,0.12)
 * - Text: white, SemiBold 18pt → text-lg font-semibold
 */
export function RvDrawer({ open, onClose }: Props) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Overlay (mobile only, tablet sidebar is always visible) */}
      {open && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
        />
      )}

      {/* Drawer / Sidebar */}
      <aside
        className={[
          'fixed top-0 left-0 h-full bg-rvBlue text-white z-50',
          // Mobile: slide-in 280px
          'w-[280px] transform transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          // Tablet+: fixed 320px, always visible, no translate
          'md:w-[320px] md:translate-x-0 md:static md:z-auto',
        ].join(' ')}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">Recipe Vault</h2>
          {/* Close button only visible on mobile */}
          <button
            aria-label="Close navigation"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu items */}
        <nav className="py-2">
          {menuItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={[
                  'relative flex items-center px-4 py-4 text-lg font-semibold',
                  active
                    ? 'bg-[rgba(247,215,116,0.12)]'
                    : 'hover:bg-white/10 focus-visible:bg-white/10',
                ].join(' ')}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-0 bottom-0 w-[6px] bg-rvYellow rounded-r" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
