/**
 * Shim for the `next` package surface used by the upstream source.
 *
 * Only type exports are needed — every runtime import from `next` in this
 * codebase is `import type { Metadata } from "next"`, which TypeScript erases.
 * Mapping the specifier here keeps the upstream files byte-identical.
 */

export type Metadata = {
  metadataBase?: URL;
  title?: string | { default?: string; template?: string; absolute?: string };
  description?: string;
  alternates?: { canonical?: string };
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
  robots?: Record<string, unknown>;
  icons?: Record<string, unknown>;
  keywords?: string | string[];
};

export type MetadataRoute = {
  Sitemap: (options?: unknown) => unknown;
  Robots: (options?: unknown) => unknown;
};
