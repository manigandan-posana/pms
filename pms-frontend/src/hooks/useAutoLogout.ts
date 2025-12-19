import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "react-redux";
import { loginPath } from "../routes/route";
import { LogoutService } from "../services/LogoutService";

/*
 * Automatically logs the user out when their MSAL access token expires.
 *
 * MSAL stores an expiry timestamp for each access token.  This hook
 * watches the timestamp (persisted in sessionStorage) and schedules a
 * logout when the token expires.  It also listens for user activity
 * events and rechecks the expiry to handle the case where the user
 * returns to the page after a period of inactivity.
 */
export const useAutoLogout = (): void => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const store = useStore();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const logoutService = new LogoutService(instance, store, navigate);

    const performLogout = async () => {
      try {
        await logoutService.logout({ redirectTo: loginPath, useRedirect: true });
      } catch (error) {
        console.error("Auto logout failed:", error);
        window.location.href = loginPath;
      }
    };

    const checkExpiry = () => {
      const expiry = sessionStorage.getItem("msal.tokenExpiry");
      if (!expiry) return;
      
      const expiryTime = parseInt(expiry, 10);
      const now = Date.now();
      const timeout = expiryTime - now;
      
      if (timeout <= 0) {
        // Token has already expired
        performLogout();
      } else {
        // Schedule a future logout when the token expires
        // Add 5 second buffer before expiry
        clearTimeout(timer);
        timer = setTimeout(() => {
          performLogout();
        }, timeout - 5000);
      }
    };

    // Initial check
    checkExpiry();

    // Listen for user interaction events to re‑evaluate the expiry
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      window.addEventListener(event, checkExpiry);
    });

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, checkExpiry);
      });
    };
  }, [instance, navigate, store]);
};