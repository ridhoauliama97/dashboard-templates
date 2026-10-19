import * as React from "react";

import { Navigate, Outlet, useRouteError, type RouteObject } from "react-router-dom";

import { NavigationSignal } from "@/shims/next-navigation";

/**
 * Route table mirroring the upstream App Router tree.
 *
 * Every page is lazy-loaded, so each screen ships as its own chunk. Layouts
 * from upstream take `children`, so each one is adapted with `<Outlet />`.
 * `notFound()` / `permanentRedirect()` are caught by `<NavigationBoundary>`,
 * which sits as close to the throwing component as possible — React Router
 * installs its own boundary around every route, so a boundary further up the
 * tree would never see the signal.
 */

const lazyPage = (importer: () => Promise<unknown>) =>
  React.lazy(importer as () => Promise<{ default: React.ComponentType }>);

const ExternalLanding = lazyPage(() => import("@/app/(external)/page"));
const NotFoundPage = lazyPage(() => import("@/app/not-found"));
const UnauthorizedPage = lazyPage(() => import("@/app/(main)/unauthorized/page"));

const DashboardLayout = lazyPage(() => import("@/app/(main)/dashboard/layout"));
const DashboardIndex = lazyPage(() => import("@/app/(main)/dashboard/page"));
const DashboardNotFound = lazyPage(() => import("@/app/(main)/dashboard/[...not-found]/page"));
const LegacyLayout = lazyPage(() => import("@/app/(main)/dashboard/(legacy)/layout"));

const DefaultPage = lazyPage(() => import("@/app/(main)/dashboard/default/page"));
const CrmPage = lazyPage(() => import("@/app/(main)/dashboard/crm/page"));
const FinancePage = lazyPage(() => import("@/app/(main)/dashboard/finance/page"));
const AnalyticsPage = lazyPage(() => import("@/app/(main)/dashboard/analytics/page"));
const ProductivityPage = lazyPage(() => import("@/app/(main)/dashboard/productivity/page"));
const EcommercePage = lazyPage(() => import("@/app/(main)/dashboard/ecommerce/page"));
const AcademyPage = lazyPage(() => import("@/app/(main)/dashboard/academy/page"));
const LogisticsPage = lazyPage(() => import("@/app/(main)/dashboard/logistics/page"));
const InfrastructurePage = lazyPage(() => import("@/app/(main)/dashboard/infrastructure/page"));
const FileManagerPage = lazyPage(() => import("@/app/(main)/dashboard/file-manager/page"));
const PatientMonitoringPage = lazyPage(() => import("@/app/(main)/dashboard/patient-monitoring/page"));
const DashboardMailPage = lazyPage(() => import("@/app/(main)/dashboard/mail/page"));
const DashboardChatPage = lazyPage(() => import("@/app/(main)/dashboard/chat/page"));
const CalendarPage = lazyPage(() => import("@/app/(main)/dashboard/calendar/page"));
const KanbanPage = lazyPage(() => import("@/app/(main)/dashboard/kanban/page"));
const TasksPage = lazyPage(() => import("@/app/(main)/dashboard/tasks/page"));
const InvoicePage = lazyPage(() => import("@/app/(main)/dashboard/invoice/page"));
const ProfilePage = lazyPage(() => import("@/app/(main)/dashboard/profile/page"));
const UsersPage = lazyPage(() => import("@/app/(main)/dashboard/users/page"));
const RolesPage = lazyPage(() => import("@/app/(main)/dashboard/roles/page"));
const ComingSoonPage = lazyPage(() => import("@/app/(main)/dashboard/coming-soon/page"));

const LegacyDefaultPage = lazyPage(() => import("@/app/(main)/dashboard/(legacy)/default-v1/page"));
const LegacyCrmPage = lazyPage(() => import("@/app/(main)/dashboard/(legacy)/crm-v1/page"));
const LegacyFinancePage = lazyPage(() => import("@/app/(main)/dashboard/(legacy)/finance-v1/page"));
const LegacyAnalyticsPage = lazyPage(() => import("@/app/(main)/dashboard/(legacy)/analytics-v1/page"));

const AuthV1Login = lazyPage(() => import("@/app/(main)/auth/v1/login/page"));
const AuthV1Register = lazyPage(() => import("@/app/(main)/auth/v1/register/page"));
const AuthV2Layout = lazyPage(() => import("@/app/(main)/auth/v2/layout"));
const AuthV2Login = lazyPage(() => import("@/app/(main)/auth/v2/login/page"));
const AuthV2Register = lazyPage(() => import("@/app/(main)/auth/v2/register/page"));

const ChatLayout = lazyPage(() => import("@/app/(main)/chat/layout"));
const ChatPage = lazyPage(() => import("@/app/(main)/chat/page"));
const MailLayout = lazyPage(() => import("@/app/(main)/mail/layout"));
const MailPage = lazyPage(() => import("@/app/(main)/mail/page"));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-6" aria-busy="true" aria-live="polite">
      <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function Suspended({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<RouteFallback />}>{children}</React.Suspense>;
}

function NotFoundFallback() {
  return <Suspended>{<NotFoundPage />}</Suspended>;
}

type BoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type BoundaryState = { error: unknown };

class NavigationBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error };
  }

  render() {
    const { error } = this.state;

    if (error instanceof NavigationSignal) {
      if (error.kind === "redirect" && error.href) {
        return <Navigate to={error.href} replace />;
      }
      return this.props.fallback;
    }

    if (error) throw error;

    return this.props.children;
  }
}

/** A page element: lazy + suspended + guarded against the navigation sentinels. */
function page(element: React.ReactNode, fallback: React.ReactNode = <NotFoundFallback />) {
  return (
    <NavigationBoundary fallback={fallback}>
      <Suspended>{element}</Suspended>
    </NavigationBoundary>
  );
}

/** A layout element (upstream layouts take `children`) around the matched child route. */
function layoutRoute(Layout: React.ComponentType<{ children: React.ReactNode }>) {
  return (
    <Suspended>
      <Layout>
        <Outlet />
      </Layout>
    </Suspended>
  );
}

/**
 * Backstop for errors React Router catches before `<NavigationBoundary>`.
 * Kept on the routes that can throw during navigation.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  if (error instanceof NavigationSignal) {
    if (error.kind === "redirect" && error.href) {
      return <Navigate to={error.href} replace />;
    }
    return <NotFoundFallback />;
  }

  const message = error instanceof Error ? error.message : "Something went wrong.";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="font-semibold text-2xl">Something went wrong.</h1>
      <p className="max-w-md text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export const routes: RouteObject[] = [
  { path: "/", element: page(<ExternalLanding />), ErrorBoundary: RouteErrorBoundary },
  { path: "/unauthorized", element: page(<UnauthorizedPage />) },

  {
    path: "/auth/v1",
    children: [
      { index: true, element: <Navigate to="/auth/v1/login" replace /> },
      { path: "login", element: page(<AuthV1Login />) },
      { path: "register", element: page(<AuthV1Register />) },
    ],
  },
  {
    path: "/auth/v2",
    element: layoutRoute(AuthV2Layout),
    children: [
      { index: true, element: <Navigate to="/auth/v2/login" replace /> },
      { path: "login", element: page(<AuthV2Login />) },
      { path: "register", element: page(<AuthV2Register />) },
    ],
  },

  {
    path: "/chat",
    element: layoutRoute(ChatLayout),
    children: [{ index: true, element: page(<ChatPage />) }],
  },
  {
    path: "/mail",
    element: layoutRoute(MailLayout),
    children: [{ index: true, element: page(<MailPage />) }],
  },

  {
    path: "/dashboard",
    element: layoutRoute(DashboardLayout),
    children: [
      { index: true, element: page(<DashboardIndex />) },
      { path: "default", element: page(<DefaultPage />) },
      { path: "crm", element: page(<CrmPage />) },
      { path: "finance", element: page(<FinancePage />) },
      { path: "analytics", element: page(<AnalyticsPage />) },
      { path: "productivity", element: page(<ProductivityPage />) },
      { path: "ecommerce", element: page(<EcommercePage />) },
      { path: "academy", element: page(<AcademyPage />) },
      { path: "logistics", element: page(<LogisticsPage />) },
      { path: "infrastructure", element: page(<InfrastructurePage />) },
      { path: "file-manager", element: page(<FileManagerPage />) },
      { path: "patient-monitoring", element: page(<PatientMonitoringPage />) },
      { path: "mail", element: page(<DashboardMailPage />) },
      { path: "chat", element: page(<DashboardChatPage />) },
      { path: "calendar", element: page(<CalendarPage />) },
      { path: "kanban", element: page(<KanbanPage />) },
      { path: "tasks", element: page(<TasksPage />) },
      { path: "invoice", element: page(<InvoicePage />) },
      { path: "profile", element: page(<ProfilePage />) },
      { path: "users", element: page(<UsersPage />) },
      { path: "roles", element: page(<RolesPage />) },
      { path: "coming-soon", element: page(<ComingSoonPage />) },
      {
        // Upstream's `(legacy)` route group adds no path segment — it only
        // wraps the v1 screens in their own layout.
        element: layoutRoute(LegacyLayout),
        children: [
          { path: "default-v1", element: page(<LegacyDefaultPage />) },
          { path: "crm-v1", element: page(<LegacyCrmPage />) },
          { path: "finance-v1", element: page(<LegacyFinancePage />) },
          { path: "analytics-v1", element: page(<LegacyAnalyticsPage />) },
        ],
      },
      { path: "*", element: page(<DashboardNotFound />) },
    ],
  },

  { path: "*", element: page(<NotFoundPage />) },
];
