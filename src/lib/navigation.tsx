import * as React from "react";

import { Link as RouterLink } from "react-router-dom";

/**
 * `Link` keeps the upstream call signature (`href`, `prefetch`, `target`,
 * `rel`) while delegating to react-router for in-app navigation. Absolute
 * URLs fall through to a plain anchor, which is what upstream's `next/link`
 * does for external destinations too.
 */

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** Accepted for API parity with next/link; unused here. */
  prefetch?: boolean;
  /** next/link pushes a history entry by default; `replace` swaps it instead. */
  replace?: boolean;
  /** Accepted for API parity with next/link; the browser restores scroll. */
  scroll?: boolean;
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch: _prefetch, replace, scroll: _scroll, ...props },
  ref,
) {
  const isExternal = /^[a-z]+:\/\//i.test(href) || href.startsWith("mailto:");

  if (isExternal) {
    return <a ref={ref} href={href} {...props} />;
  }

  return <RouterLink ref={ref} to={href} replace={replace} {...props} />;
});

export { usePathname, useRouter, useSearchParams, useParams } from "@/shims/next-navigation";
