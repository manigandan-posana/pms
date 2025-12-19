/*
 * GlobalLoader component – displays a PrimeReact ProgressSpinner centered on the
 * screen. This loader can be used as a fallback for lazy‑loaded routes
 * (React.lazy + Suspense) and as an overlay for app‑wide loading states.
 */

import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

interface GlobalLoaderProps {
  /** Whether the loader should overlay the entire viewport. When false the
   * spinner will be inline. Default: true. */
  overlay?: boolean;
  /** Optional additional CSS classes for the wrapper. */
  className?: string;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ overlay = true, className = '' }) => {
  const spinner = (
    <ProgressSpinner
      style={{ width: '50px', height: '50px' }}
      strokeWidth="8"
      fill="var(--surface-ground)"
      animationDuration=".5s"
    />
  );

  if (!overlay) {
    return <div className={`flex items-center justify-center ${className}`}>{spinner}</div>;
  }

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-white/70 backdrop-blur ${className}`}
      role="status"
      aria-label="Loading…"
    >
      {spinner}
    </div>
  );
};

export default GlobalLoader;