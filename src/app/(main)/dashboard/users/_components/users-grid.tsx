"use client";

import type { ReactTable } from "@tanstack/react-table";
import { Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { getInitials } from "@/lib/utils";

import type { UserRow } from "./data";

const statusTone: Record<UserRow["status"], string> = {
  Active: "border-green-600/40 text-green-700 dark:text-green-500",
  "Pending invite": "border-amber-600/40 text-amber-700 dark:text-amber-500",
  Deactivated: "text-muted-foreground",
  Locked: "text-muted-foreground",
  Suspended: "border-destructive/40 text-destructive",
};

/**
 * Grid counterpart of `UsersTable`. It renders the same row model, so search,
 * filters, sorting and paging apply identically in both views.
 */
export function UsersGrid({ table }: { table: ReactTable<DataTableFeatures, UserRow> }) {
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <p className="mx-4 rounded-lg border border-dashed px-3 py-10 text-center text-muted-foreground text-sm">
        No users match the current filters.
      </p>
    );
  }

  return (
    <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const user = row.original;

        return (
          <Card key={user.email} className="gap-3 py-4 shadow-none">
            <CardHeader className="px-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-xs">
                  {getInitials(user.name)}
                </span>
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm">{user.name}</CardTitle>
                  <p className="truncate text-muted-foreground text-xs">{user.role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{user.team}</span>
                <Badge variant="outline" className={statusTone[user.status]}>
                  {user.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
