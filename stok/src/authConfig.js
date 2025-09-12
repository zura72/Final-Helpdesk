// authConfig.js
import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "f536a53d-8a16-45cf-9acf-d8c77212b605",
    authority: "https://login.microsoftonline.com/94526da5-8783-4516-9eb7-8c58bbf66a2d",
    redirectUri: window.location.origin + "/stok/",
    postLogoutRedirectUri: window.location.origin + "/stok/",
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
  system: {
    allowNativeBroker: false
  }
};

export const loginRequest = {
  scopes: ["User.Read", "Sites.Read.All", "Sites.ReadWrite.All"],
};

export function getMsalConfig(persistent = true) {
  return {
    auth: {
      clientId: "f536a53d-8a16-45cf-9acf-d8c77212b605",
      authority: "https://login.microsoftonline.com/94526da5-8783-4516-9eb7-8c58bbf66a2d",
      redirectUri: window.location.origin + "/stok/",
      postLogoutRedirectUri: window.location.origin + "/stok/",
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: persistent ? "localStorage" : "sessionStorage",
      storeAuthStateInCookie: true,
    },
  };
}

// Buat instance MSAL di sini
export const msalInstance = new PublicClientApplication(msalConfig);

// Inisialisasi MSAL
msalInstance.initialize().then(() => {
  console.log("MSAL initialized successfully");
}).catch(error => {
  console.error("MSAL initialization failed:", error);
});