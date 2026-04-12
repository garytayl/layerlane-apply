import type { ReactNode } from "react";

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f6f5f2] via-[#f0eeea] to-[#e8e5df] dark:from-neutral-950 dark:via-[#0c0c0c] dark:to-black">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(90,88,82,0.12),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(255,255,255,0.05),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen max-w-[440px] flex-col justify-center px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-neutral-200/90 bg-white/95 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-neutral-800/90 dark:bg-neutral-950/95 dark:shadow-[0_12px_48px_rgba(0,0,0,0.45)]">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-neutral-900 dark:text-neutral-50">
            {title}
          </h1>
          {description ? (
            <div className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {description}
            </div>
          ) : null}
          <div className="mt-8">{children}</div>
          {footer ? (
            <div className="mt-8 border-t border-neutral-200/90 pt-6 dark:border-neutral-800/90">
              {footer}
            </div>
          ) : null}
        </div>
        <p className="mt-8 text-center text-[13px] text-neutral-500 dark:text-neutral-500">
          layerlane-apply
        </p>
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-[15px] text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-800 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10";

const labelClassName =
  "flex flex-col gap-1.5 text-[13px] font-medium text-neutral-700 dark:text-neutral-300";

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
      className={[inputClassName, className].filter(Boolean).join(" ")}
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
      className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.995] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
    >
      {children}
    </button>
  );
}

export { inputClassName, labelClassName };
