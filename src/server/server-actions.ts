/**
 * Client-side stand-in for the upstream Server Actions.
 *
 * The reference writes preferences through a `"use server"` action so the
 * cookie is readable during SSR. A static build has no server, so the same
 * cookie is written from the browser — the boot script in `index.html` reads it
 * back before first paint, which gives the identical no-flicker behaviour.
 */

import { getClientCookie, setClientCookie } from "@/lib/cookie.client";
import {
  getPreferencePersistence,
  PREFERENCE_REGISTRY,
  type PreferenceKey,
  type PreferenceValueMap,
  parsePreference,
} from "@/lib/preferences/preferences-config";

export async function getValueFromCookie(key: string): Promise<string | undefined> {
  return getClientCookie(key) ?? undefined;
}

/** Synchronous variant — async page components are made sync in this build. */
export function getValueFromCookieSync(key: string): string | undefined {
  return getClientCookie(key) ?? undefined;
}

export async function setValueToCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): Promise<void> {
  // Next's `maxAge` is seconds; the client helper takes days.
  const days = options.maxAge ? options.maxAge / 86400 : undefined;
  setClientCookie(key, value, days);
}

export async function getPreference<K extends PreferenceKey>(key: K): Promise<PreferenceValueMap[K]> {
  const definition = PREFERENCE_REGISTRY[key];
  const persistence = getPreferencePersistence(key);

  if (persistence !== "client-cookie" && persistence !== "server-cookie") {
    return definition.defaultValue as PreferenceValueMap[K];
  }

  return parsePreference(key, getClientCookie(key)?.trim());
}

/** Synchronous variant used by the dashboard layout, which no longer awaits. */
export function getPreferenceSync<K extends PreferenceKey>(key: K): PreferenceValueMap[K] {
  const definition = PREFERENCE_REGISTRY[key];
  const persistence = getPreferencePersistence(key);

  if (persistence !== "client-cookie" && persistence !== "server-cookie") {
    return definition.defaultValue as PreferenceValueMap[K];
  }

  return parsePreference(key, getClientCookie(key)?.trim());
}
