import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-[14px] border border-border bg-card", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header className={cn("flex items-start justify-between gap-4", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-sm font-medium tracking-[-0.01em]", className)} {...props} />;
}

export { Card, CardHeader, CardTitle };
