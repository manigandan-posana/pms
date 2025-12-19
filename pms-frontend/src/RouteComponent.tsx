// src/RouteComponent.tsx
import { useAutoLogout } from "./hooks/useAutoLogout";
import React, { Suspense, useLayoutEffect } from "react";
import GlobalLoader from "./components/GlobalLoader";

interface IRouteProps {
  component: React.ElementType;
  layout?: React.ElementType;
}

const RouteComponent = ({ component: Component, layout: Layout }: IRouteProps) => {
  // Auto-logout logic (MSAL / token expiry)
  useAutoLogout();

  /*
   * Perform DOM measurements synchronously before painting to reduce flicker.
   * This hook will run before the browser repaints the screen, unlike useEffect.
   * For now this is a no‑op, but you could add measurement logic here if needed.
   */
  useLayoutEffect(() => {
    // Placeholder for any synchronous operations prior to paint.
  }, []);

  // Lazily loaded components need to be wrapped in Suspense. Use our global
  // loader as a fallback while waiting for the component code to be loaded.
  const inner = (
    <Suspense fallback={<GlobalLoader />}>
      <Component />
    </Suspense>
  );

  return Layout ? <Layout>{inner}</Layout> : inner;
};

export default RouteComponent;
