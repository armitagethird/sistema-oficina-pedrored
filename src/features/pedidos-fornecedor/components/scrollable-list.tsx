import * as React from "react";

import { cn } from "@/lib/utils";

export function ScrollableList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-h-72 overflow-y-auto rounded-md border bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
