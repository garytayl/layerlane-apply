import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background noise-overlay">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,oklch(0.5_0.02_60/0.08),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,oklch(0.9_0.02_60/0.06),transparent)]"
        aria-hidden
      />
      <div className="relative z-[2] mx-auto flex min-h-screen max-w-[440px] flex-col justify-center px-4 py-14 sm:px-6">
        <div
          className={cn(
            "rounded-2xl border border-border bg-card/95 p-8 shadow-lg shadow-foreground/5 backdrop-blur-md",
            "dark:shadow-foreground/10",
          )}
        >
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display mt-2 text-[1.75rem] leading-tight tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </div>
          ) : null}
          <div className="mt-8">{children}</div>
          {footer ? (
            <div className="mt-8 border-t border-border pt-6">{footer}</div>
          ) : null}
        </div>
        <p className="mt-8 text-center text-[13px] text-muted-foreground">
          layerlane-apply
        </p>
      </div>
    </div>
  );
}

const inputClassName = cn(
  "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-[15px] text-foreground shadow-sm outline-none transition",
  "placeholder:text-muted-foreground",
  "focus:border-ring focus:ring-2 focus:ring-ring/30",
);

const labelClassName =
  "flex flex-col gap-1.5 text-[13px] font-medium text-foreground";

export function AuthFieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label className={labelClassName} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function AuthInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(inputClassName, className)}
    />
  );
}

export function AuthSubmitButton({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.995]"
    >
      {children}
    </button>
  );
}

export { inputClassName, labelClassName };
