import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
