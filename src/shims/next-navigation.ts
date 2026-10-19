/**
 * Shim for `next/navigation`.
 *
 * `useRouter` / `usePathname` delegate to react-router. `notFound()` and the
 * redirect helpers reproduce Next's control-flow-by-throwing: they raise a
 * sentinel that `<NavigationBoundary>` catches at the route level.
 */

import { useLocation, useNavigate } from "react-router-dom";

export class NavigationSignal extends Error {
  readonly kind: "redirect" | "notFound";
  readonly href?: string;

  constructor(kind: "redirect" | "notFound", href?: string) {
    super(`navigation:${kind}${href ? `:${href}` : ""}`);
    this.name = "NavigationSignal";
    this.kind = kind;
    this.href = href;
  }
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(useLocation().search);
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string>>(): T {
  const params = useLocation().pathname.split("/").filter(Boolean);
  return { slug: params.at(-1) } as unknown as T;
}

export function useRouter() {
  const navigate = useNavigate();

  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => undefined,
    prefetch: () => undefined,
  };
}

export function notFound(): never {
  throw new NavigationSignal("notFound");
}

export function redirect(href: string): never {
  throw new NavigationSignal("redirect", href);
}

export function permanentRedirect(href: string): never {
  throw new NavigationSignal("redirect", href);
}
