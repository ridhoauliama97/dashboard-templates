import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

/**
 * Root layout.
 *
 * Upstream renders `<html>`/`<body>` here so the data attributes and the boot
 * script can be server-rendered. A static build already ships those in
 * `index.html` (with the same attributes and the same boot script), so this
 * component provides only the provider tree and the global stylesheet.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <TooltipProvider>
      <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
        {children}
        <Toaster />
      </PreferencesStoreProvider>
    </TooltipProvider>
  );
}
