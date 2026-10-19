import * as React from "react";

import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { GitHubStarButton } from "./github-star-button";

const repositoryUrl = "https://github.com/arhamkhnz/next-shadcn-admin-dashboard";
const repositoryStarsUrl = "https://api.github.com/repos/arhamkhnz/next-shadcn-admin-dashboard/stargazers/count";

type GitHubStarsResponse = {
  count: number;
};

export function Intro() {
  // Upstream awaits this in a Server Component with `next: { revalidate }`.
  // Here it is fetched once on the client; the button renders without a count
  // until (or unless) the request succeeds.
  const [starCount, setStarCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadStarCount() {
      try {
        const response = await fetch(repositoryStarsUrl, {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "arhamkhnz-studio-admin",
            "X-GitHub-Api-Version": "2026-03-10",
          },
        });

        if (!response.ok) return;

        const data = (await response.json()) as GitHubStarsResponse;
        if (!cancelled && Number.isFinite(data.count)) setStarCount(data.count);
      } catch {
        // Leave the count empty; the button still links to the repository.
      }
    }

    void loadStarCount();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-balance font-medium text-2xl leading-snug tracking-tight sm:text-3xl" id="hero-title">
          A polished admin dashboard built to fit your stack and the way you work.
        </h1>
        <p className="text-muted-foreground text-sm leading-6 sm:text-base">
          Choose Radix UI, Base UI, React Aria, or TanStack Start, all with the same polished experience.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button asChild>
          <Link href="/dashboard/default" prefetch={false}>
            Live demo
            <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </Button>
        <GitHubStarButton initialCount={starCount} repositoryUrl={repositoryUrl} />
      </div>
    </div>
  );
}
