// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/store"; // with persist
import { initializeStoreReference } from "./hooks/useAppStore";
import { BrowserRouter } from "react-router-dom";
import {
  PublicClientApplication,
  type EventMessage,
  EventType,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { msalConfig } from "./auth/authConfig";
import { MsalProvider } from "@azure/msal-react";

// Create a single instance of PublicClientApplication for the entire app.  This
// mirrors the MSAL initialization performed in the Glia project.  The
// instance is initialized before rendering the application and will
// automatically pick up any account stored in sessionStorage from a
// previous session.
const msalInstance = new PublicClientApplication(msalConfig);
msalInstance.initialize().then(() => {
  const activeAccount = msalInstance.getActiveAccount();
  if (!activeAccount) {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }
});
// Update the active account on successful login events
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const authResult = event.payload as AuthenticationResult;
    const account = authResult.account;
    msalInstance.setActiveAccount(account);
  }
});
// Enable account storage events so that tabs stay in sync
msalInstance.enableAccountStorageEvents();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

// Initialize store reference for services
initializeStoreReference(store);

createRoot(container).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <Provider store={store}>
        <PersistGate loading={<>Loading...</>} persistor={persistor}>
          {/* Wrap App in BrowserRouter so that routing hooks (useNavigate, useLocation, etc.) have access to a router context */}
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </MsalProvider>
  </StrictMode>
);
