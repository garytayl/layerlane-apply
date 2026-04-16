import "server-only";

import OpenAI from "openai";
import {
  SOURCE_EXTRACTION_SYSTEM_PROMPT,
  chunkSourceText,
  parseSourceExtractionFromLlmJson,
} from "@layerlane/core";
import { createClient } from "@/lib/supabase/server";

const MAX_RAW_CHARS = 120_000;

function formatChunksForPrompt(chunks: string[]): string {
  return chunks
    .map((c, i) => `--- Chunk ${i} ---\n${c}`)
    .join("\n\n");
}

export async function runSourceExtraction(documentId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: doc, error: docErr } = await supabase
    .from("source_documents")
    .select("id, user_id, raw_text, title, kind")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (docErr || !doc) {
    throw new Error("Source not found");
  }

  const raw = doc.raw_text.slice(0, MAX_RAW_CHARS);
  const chunks = chunkSourceText(raw);

  await supabase
    .from("source_documents")
    .update({
      extraction_status: "running",
      extraction_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("user_id", user.id);

  await supabase.from("source_chunks").delete().eq("document_id", documentId);

  if (chunks.length > 0) {
    const rows = chunks.map((content, chunk_index) => ({
      document_id: documentId,
      chunk_index,
      content,
    }));
    const { error: chErr } = await supabase.from("source_chunks").insert(rows);
    if (chErr) {
      await supabase
        .from("source_documents")
        .update({
          extraction_status: "failed",
          extraction_error: chErr.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId);
      throw new Error(chErr.message);
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await supabase
      .from("source_documents")
      .update({
        extraction_status: "failed",
        extraction_error: "OPENAI_API_KEY is not set",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });
  const model = "gpt-4o-mini";

  const userContent = `Document title: ${doc.title ?? "(untitled)"}
Kind: ${doc.kind}

Chunks (use source_chunk_index to reference a chunk when relevant):

${formatChunksForPrompt(chunks.length ? chunks : [raw.slice(0, 12_000)])}
`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SOURCE_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const rawJson = completion.choices[0]?.message?.content;
    if (!rawJson) {
      throw new Error("Empty model response");
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawJson);
    } catch {
      throw new Error("Model did not return valid JSON");
    }

    const extraction = parseSourceExtractionFromLlmJson(parsedJson);

    const { error: upErr } = await supabase
      .from("source_documents")
      .update({
        extraction_status: "ready",
        extraction_payload: extraction as unknown as Record<string, unknown>,
        extraction_error: null,
        model,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (upErr) {
      throw new Error(upErr.message);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Extraction failed";
    await supabase
      .from("source_documents")
      .update({
        extraction_status: "failed",
        extraction_error: msg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("user_id", user.id);
    throw e;
  }
}
