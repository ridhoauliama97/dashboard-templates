"use client";

import { CalendarDays, Search } from "lucide-react";
import { cn } from "cn";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/utils";

import { columns, columnTones, priorityBadgeConfig, tagTones } from "./data";
import type { BoardTask } from "./types";

export function KanbanTableView({ tasks }: { tasks: BoardTask[] }) {
  if (tasks.length === 0) {
    return (
      <Empty className="min-h-64">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>No tasks found</EmptyTitle>
          <EmptyDescription>Try a different search term.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
      <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 font-medium text-muted-foreground">Task</TableHead>
            <TableHead className="h-11 font-medium text-muted-foreground">Status</TableHead>
            <TableHead className="h-11 font-medium text-muted-foreground">Priority</TableHead>
            <TableHead className="h-11 font-medium text-muted-foreground">Team</TableHead>
            <TableHead className="h-11 font-medium text-muted-foreground">Owner</TableHead>
            <TableHead className="h-11 font-medium text-muted-foreground">Due date</TableHead>
            <TableHead className="h-11 text-right font-medium text-muted-foreground">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(({ task, columnId }) => {
            const column = columns.find((column) => column.id === columnId);
            const owner = task.owner;
            const priority = priorityBadgeConfig[task.priority];
            const PriorityIcon = priority.icon;

            return (
              <TableRow key={task.id} className="border-border/60 hover:bg-muted/20">
                <TableCell className="max-w-72">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium text-sm">{task.title}</span>
                    <span className="truncate text-muted-foreground text-xs">{task.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn("rounded-md border-transparent px-2 font-medium", columnTones[columnId])}
                  >
                    {column?.title}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={priority.variant}
                    className={cn("rounded-md border-transparent px-2 font-medium", priority.className)}
                  >
                    <PriorityIcon data-icon="inline-start" />
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn("rounded-md border-transparent px-2 font-medium", tagTones[task.team])}
                  >
                    {task.team}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar size="sm" className={cn("after:rounded-sm", owner.tone)}>
                      <AvatarFallback className="rounded-sm text-[10px]">{getInitials(owner.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{owner.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-sm">
                    <CalendarDays className="size-3.5 text-muted-foreground" />
                    <span className="tabular-nums">{task.dueDate}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Progress value={task.progress} className="w-20" />
                    <span className="w-9 text-right text-xs tabular-nums">{task.progress}%</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
