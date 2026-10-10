import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#fa233b] text-white hover:bg-[#fc3c44] shadow-[0_2px_12px_rgba(250,35,59,0.3)]",
        apple: "bg-white text-black hover:bg-[#e5e5ea] shadow-sm",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline:
          "border border-white/15 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/30 text-[#f5f5f7]",
        secondary:
          "bg-white/[0.08] text-[#f5f5f7] hover:bg-white/[0.14] border border-white/[0.06] backdrop-blur-md",
        ghost:
          "hover:bg-white/[0.08] text-[#f5f5f7]/80 hover:text-white",
        link: "text-[#2997ff] underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 rounded-full gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-full px-6 text-base has-[>svg]:px-4 font-medium",
        icon: "size-9 rounded-full",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
