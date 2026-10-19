/**
 * Shim for `next/headers`.
 *
 * There is no request scope in a static build, so `cookies()` reads the
 * document cookie jar. The upstream `dashboard/layout.tsx` is async solely to
 * `await cookies()`; it is made synchronous in this build.
 */

import { getClientCookie, setClientCookie } from "@/lib/cookie.client";

type CookieRecord = { name: string; value: string };

type CookieStore = {
  get: (name: string) => CookieRecord | undefined;
  getAll: () => CookieRecord[];
  set: (name: string, value: string) => void;
  delete: (name: string) => void;
  has: (name: string) => boolean;
};

export function cookies(): CookieStore {
  return {
    get(name) {
      const value = getClientCookie(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll() {
      if (typeof document === "undefined") return [];
      return document.cookie
        .split("; ")
        .filter(Boolean)
        .map((entry) => {
          const [name, ...rest] = entry.split("=");
          return { name, value: decodeURIComponent(rest.join("=")) };
        });
    },
    set(name, value) {
      setClientCookie(name, value);
    },
    delete(name) {
      setClientCookie(name, "", 0);
    },
    has(name) {
      return getClientCookie(name) !== null;
    },
  };
}
