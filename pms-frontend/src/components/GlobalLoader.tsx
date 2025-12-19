import React from 'react';
import { CircularProgress } from '@mui/material';

interface GlobalLoaderProps {
  /** Whether the loader should overlay the entire viewport. When false the
   * spinner will be inline. Default: true. */
  overlay?: boolean;
  /** Optional additional CSS classes for the wrapper. */
  className?: string;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ overlay = true, className = '' }) => {
  if (!overlay) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <CircularProgress size={50} thickness={4} />
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-white/70 backdrop-blur ${className}`}
      role="status"
      aria-label="Loading…"
    >
      <CircularProgress size={50} thickness={4} />
    </div>
  );
};

export default GlobalLoader;