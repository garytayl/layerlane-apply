import { exportChqSnapshot } from "@/lib/chq-sync";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const hostname = new URL(request.url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    return Response.json({ error: "Local snapshot export is only available on this computer" }, { status: 403 });
  }
  return new Response(JSON.stringify(await exportChqSnapshot(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="career-hq-snapshot-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
