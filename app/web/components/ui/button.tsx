import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-sm",
        secondary:
          "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--nav-hover-bg)] shadow-sm",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--nav-hover-bg)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text)]",
        destructive:
          "bg-[var(--error)] text-[var(--primary-foreground)] hover:brightness-90 shadow-sm",
        link: "text-[var(--primary-dark)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-10 px-4 text-xs",
        default: "h-12 px-5 py-3",
        lg: "h-[52px] px-7",
        icon: "h-12 w-12 p-0",
        "icon-sm": "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "opacity-80 cursor-not-allowed"
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Slot needs exactly one child, so asChild renders the child alone. */}
        {asChild ? children : (
          <>
            {loading && (
              <span
                aria-hidden="true"
                className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0 mr-1.5"
              />
            )}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
