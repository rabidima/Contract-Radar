import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
  {
    variants: {
      tone: {
        mute: "bg-elevated text-muted border border-border",
        accent: "bg-accent/15 text-accent border border-accent/25",
        go: "bg-go/15 text-go border border-go/25",
        hold: "bg-hold/15 text-hold border border-hold/25",
        nogo: "bg-nogo/15 text-nogo border border-nogo/25",
        paper: "bg-paper/10 text-paper border border-paper/20",
      },
    },
    defaultVariants: { tone: "mute" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
