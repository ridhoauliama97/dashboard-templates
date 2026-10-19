import * as React from "react";

import type { Metadata } from "next";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { MetricCards } from "./_components/metric-cards";

export const metadata: Metadata = {
  title: "Open Source Business Dashboard with shadcn/ui",
  description:
    "Explore an open source admin dashboard with business metrics, customer activity, performance charts, and customer data.",
  alternates: {
    canonical: "/dashboard/default",
  },
};

/**
 * The two heavy sections are split out of the route chunk:
 * - PerformanceOverview pulls in Recharts (~123 KB gzipped)
 * - SubscriberOverview pulls in TanStack Table + the 12 KB dataset
 *
 * The section components themselves are verbatim upstream; only this page adds
 * the lazy boundary, so the KPI cards paint without waiting on either bundle.
 */
const PerformanceOverview = React.lazy(() =>
  import("./_components/performance-overview").then((module) => ({ default: module.PerformanceOverview })),
);

const SubscriberOverview = React.lazy(() =>
  import("./_components/subscriber-overview").then((module) => ({ default: module.SubscriberOverview })),
);

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3.5 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function TableCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3.5 w-80" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-7 w-80 rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <MetricCards />
      <React.Suspense fallback={<ChartCardSkeleton />}>
        <PerformanceOverview />
      </React.Suspense>
      <React.Suspense fallback={<TableCardSkeleton />}>
        <SubscriberOverview />
      </React.Suspense>
    </div>
  );
}
