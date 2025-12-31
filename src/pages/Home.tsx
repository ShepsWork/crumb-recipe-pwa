import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { RvHeader } from '../components/RvHeader';
import { RvDrawer } from '../components/RvDrawer';

/**
 * Home / Launch screen for Recipe Vault (deterministic per spec §13)
 * - Full-bleed orange gradient background with radial glow
 * - Hero vault graphic centered
 * - Headline + subhead
 * - CTA: Get Started (56px pill, gradient left→right, shadow)
 */
export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (fixed on tablet+) */}
      <RvDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header (mobile only; tablet has sidebar) */}
        <div className="md:hidden">
          <RvHeader title="Recipe Vault" onMenuOpen={() => setDrawerOpen(true)} />
        </div>

        {/* Hero zone with gradient background and glow */}
        <div className="flex-1 rv-header-gradient relative flex flex-col items-center justify-center px-6 py-12">
          {/* Radial glow behind hero */}
          <div className="absolute inset-0 rv-hero-glow pointer-events-none" />

          {/* Hero graphic (vault icon fallback; replace with PNG asset if available) */}
          <div className="relative z-10 w-40 h-40 md:w-52 md:h-52 rounded-full bg-white/10 flex items-center justify-center shadow-lg">
            <Lock className="h-20 w-20 md:h-28 md:w-28 text-white drop-shadow" />
          </div>

          {/* Headline */}
          <h1 className="relative z-10 mt-8 text-white font-bold text-4xl md:text-5xl text-center tracking-tight">
            Your recipes, safely stored
          </h1>

          {/* Subhead */}
          <p className="relative z-10 mt-3 text-white/90 text-lg md:text-xl text-center max-w-md">
            Organize, edit, and cook with confidence — even offline.
          </p>

          {/* CTA Button */}
          <Link
            to="/library"
            className="relative z-10 mt-10 inline-flex items-center justify-center h-14 px-10 rounded-full rv-cta-gradient rv-cta-shadow text-white font-bold text-lg hover:opacity-95 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
