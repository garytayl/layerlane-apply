"use client";

import { useFormStatus } from "react-dom";

function PendingLabel({ hasAnalysis }: { hasAnalysis: boolean }) {
  const { pending } = useFormStatus();
  if (pending) return <>Analyzing…</>;
  return <>{hasAnalysis ? "Re-analyze" : "Run analysis"}</>;
}

export function AnalyzeButton({
  analyzeAction,
  hasAnalysis,
}: {
  analyzeAction: () => Promise<void>;
  hasAnalysis: boolean;
}) {
  return (
    <form action={analyzeAction}>
      <button
        type="submit"
        className="rounded border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-600"
      >
        <PendingLabel hasAnalysis={hasAnalysis} />
      </button>
    </form>
  );
}
