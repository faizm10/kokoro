import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full resize-none bg-transparent text-[15px] leading-7 text-foreground outline-none placeholder:text-stone/65",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
