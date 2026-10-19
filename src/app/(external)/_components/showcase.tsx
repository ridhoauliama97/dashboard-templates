import { Card } from "@/components/ui/card";

/**
 * Upstream imports these through `next/image`'s static import, which returns
 * `{ src, width, height }`. Vite serves `public/` directly, so the URL and the
 * intrinsic dimensions are declared here instead. Both files are 4800x2700.
 */
const defaultLightImage = { src: "/media/default/default-light.webp", width: 4800, height: 2700 };
const defaultDarkImage = { src: "/media/default/default-dark.webp", width: 4800, height: 2700 };

export function Showcase() {
  return (
    <section aria-label="Studio Admin preview">
      <Card className="rounded-lg py-0" data-landing-dashboard-preview>
        {/* biome-ignore lint/performance/noImgElement: These landing images are optimized separately. */}
        <img
          alt="Studio Admin default dashboard with its layout customization controls open"
          className="h-auto w-full rounded-lg! dark:hidden"
          height={defaultLightImage.height}
          src={defaultLightImage.src}
          width={defaultLightImage.width}
        />
        {/* biome-ignore lint/performance/noImgElement: These landing images are optimized separately. */}
        <img
          alt="Studio Admin default dashboard with its layout customization controls open"
          className="hidden h-auto w-full rounded-lg! dark:block"
          height={defaultDarkImage.height}
          src={defaultDarkImage.src}
          width={defaultDarkImage.width}
        />
      </Card>
    </section>
  );
}
