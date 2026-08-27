"use server";

import { chqBridgeScopeSchema } from "@layerlane/core";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createBridgeClient, getBridgeMode, isLoopbackHostname, revokeBridgeClient } from "@/lib/chq-bridge";

export type NewClientState = { token?: string; expiresAt?: string; error?: string };

async function assertLocalAdmin() {
  const host = (await headers()).get("host") || "";
  const hostname = host ? new URL(`http://${host}`).hostname : "";
  if (getBridgeMode() !== "local" || !isLoopbackHostname(hostname)) throw new Error("Bridge administration is local-only");
}

export async function createClientAction(_state: NewClientState, formData: FormData): Promise<NewClientState> {
  try {
    await assertLocalAdmin();
    const name = String(formData.get("name") || "").trim();
    const scopes = formData.getAll("scopes").map(String);
    scopes.forEach((scope) => chqBridgeScopeSchema.parse(scope));
    const created = await createBridgeClient(name, scopes, Number(formData.get("ttl_hours") || 24));
    revalidatePath("/local-ledger/bridge");
    return { token: created.token, expiresAt: created.expires_at };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create client" };
  }
}

export async function revokeClientAction(formData: FormData) {
  await assertLocalAdmin();
  await revokeBridgeClient(String(formData.get("id") || ""));
  revalidatePath("/local-ledger/bridge");
}
