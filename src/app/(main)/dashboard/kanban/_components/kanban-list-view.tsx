"use client";

import { CalendarDays, Search } from "lucide-react";
import { cn } from "cn";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/utils";

import { columns, columnTones, priorityBadgeConfig, tagTones } from "./data";
import type { BoardTask, ColumnId, Task } from "./types";

function KanbanListRow({ task, columnId }: { task: Task; columnId: ColumnId }) {
  const column = columns.find((column) => column.id === columnId);
  const owner = task.owner;
  const priority = priorityBadgeConfig[task.priority];
  const PriorityIcon = priority.icon;

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Badge
            variant="secondary"
            className={cn("shrink-0 rounded-md border-transparent px-2 font-medium", columnTones[columnId])}
          >
            {column?.title}
          </Badge>
          <h3 className="min-w-0 truncate font-medium text-sm leading-none">{task.title}</h3>
        </div>
        <Badge
          variant={priority.variant}
          className={cn("shrink-0 rounded-md border-transparent px-2 font-medium", priority.className)}
        >
          <PriorityIcon data-icon="inline-start" />
          {task.priority}
        </Badge>
      </div>

      <p className="line-clamp-1 text-muted-foreground text-sm leading-5">{task.description}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar className={cn("size-5 after:rounded-sm", owner.tone)}>
            <AvatarFallback className="rounded-sm text-[10px]">{getInitials(owner.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{owner.name}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          <span className="tabular-nums">{task.dueDate}</span>
        </span>
        <Badge
          variant="secondary"
          className={cn("rounded-md border-transparent px-2 font-medium", tagTones[task.team])}
        >
          {task.team}
        </Badge>
        <span className="ml-auto flex items-center gap-2">
          <Progress value={task.progress} className="w-24" />
          <span className="w-9 text-right text-xs tabular-nums">{task.progress}%</span>
        </span>
      </div>
    </article>
  );
}

export function KanbanListView({ tasks }: { tasks: BoardTask[] }) {
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
    <div className="flex flex-col gap-3">
      {tasks.map(({ task, columnId }) => (
        <KanbanListRow key={task.id} task={task} columnId={columnId} />
      ))}
    </div>
  );
}
