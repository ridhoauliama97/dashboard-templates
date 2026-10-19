import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { NavigationSignal } from "@/shims/next-navigation";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

createRoot(rootElement, {
  // `notFound()` / `permanentRedirect()` are implemented by throwing, exactly
  // as Next does. The route boundary handles them, so keep them out of the
  // console while still reporting genuine render errors.
  onCaughtError(error, errorInfo) {
    if (error instanceof NavigationSignal) return;
    console.error(error, errorInfo);
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
