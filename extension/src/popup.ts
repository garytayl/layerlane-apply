const baseUrlInput = document.getElementById("baseUrl") as HTMLInputElement;
const tokenInput = document.getElementById("token") as HTMLInputElement;
const saveBtn = document.getElementById("save") as HTMLButtonElement;
const runBtn = document.getElementById("run") as HTMLButtonElement;
const errorEl = document.getElementById("error") as HTMLDivElement;
const outEl = document.getElementById("out") as HTMLDivElement;

const STORAGE_KEYS = { baseUrl: "baseUrl", token: "token" } as const;

function showError(msg: string) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

function hideError() {
  errorEl.hidden = true;
}

async function loadSettings() {
  const s = await chrome.storage.sync.get([STORAGE_KEYS.baseUrl, STORAGE_KEYS.token]);
  baseUrlInput.value = (s[STORAGE_KEYS.baseUrl] as string) || "http://localhost:3000";
  tokenInput.value = (s[STORAGE_KEYS.token] as string) || "";
}

saveBtn.addEventListener("click", async () => {
  hideError();
  const baseUrl = baseUrlInput.value.trim().replace(/\/$/, "");
  const token = tokenInput.value.trim();
  if (!baseUrl || !token) {
    showError("Enter base URL and token.");
    return;
  }
  await chrome.storage.sync.set({
    [STORAGE_KEYS.baseUrl]: baseUrl,
    [STORAGE_KEYS.token]: token,
  });
  outEl.hidden = false;
  outEl.textContent = "Saved.";
});

runBtn.addEventListener("click", async () => {
  hideError();
  outEl.hidden = true;
  const baseUrl = baseUrlInput.value.trim().replace(/\/$/, "");
  const token = tokenInput.value.trim();
  if (!baseUrl || !token) {
    showError("Enter base URL and token first.");
    return;
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) {
    showError("No active tab.");
    return;
  }

  runBtn.disabled = true;
  try {
    const raw = await chrome.tabs.sendMessage<{ type: string }, { text: string; title: string; href: string }>(
      tab.id,
      { type: "GET_JD" },
    );
    if (!raw?.text?.trim()) {
      showError("Could not read page text. Try a normal http(s) job posting page.");
      return;
    }

    const createRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        raw_jd_text: raw.text,
        url: raw.href,
        title: raw.title,
        company: null,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      showError((err as { error?: string }).error || `Create job failed (${createRes.status})`);
      return;
    }

    const { id: jobId } = (await createRes.json()) as { id: string };

    const analyzeRes = await fetch(`${baseUrl}/api/jobs/${jobId}/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!analyzeRes.ok) {
      const err = await analyzeRes.json().catch(() => ({}));
      showError((err as { error?: string }).error || `Analyze failed (${analyzeRes.status})`);
      return;
    }

    const data = (await analyzeRes.json()) as {
      fit_score: number;
      summary: string;
      why_role: string;
      ranked_bullets: { text: string; relevance: string }[];
    };

    const lines: string[] = [];
    lines.push(`Fit: ${data.fit_score}/100`);
    lines.push("");
    lines.push("Summary");
    lines.push(data.summary);
    lines.push("");
    lines.push("Why this role");
    lines.push(data.why_role);
    lines.push("");
    lines.push("Bullets");
    data.ranked_bullets?.forEach((b, i) => {
      lines.push(`${i + 1}. ${b.text}`);
      lines.push(`   ${b.relevance}`);
    });

    outEl.hidden = false;
    outEl.innerHTML = "";
    const pre = document.createElement("div");
    pre.textContent = lines.join("\n");
    outEl.appendChild(pre);

    const copyAll = document.createElement("button");
    copyAll.type = "button";
    copyAll.className = "copy";
    copyAll.textContent = "Copy all";
    copyAll.addEventListener("click", () => {
      void navigator.clipboard.writeText(lines.join("\n"));
    });
    outEl.appendChild(copyAll);

    data.ranked_bullets?.forEach((b, i) => {
      const row = document.createElement("div");
      row.style.marginTop = "8px";
      const bbtn = document.createElement("button");
      bbtn.type = "button";
      bbtn.className = "copy";
      bbtn.textContent = `Copy #${i + 1}`;
      bbtn.addEventListener("click", () => {
        void navigator.clipboard.writeText(b.text);
      });
      row.appendChild(bbtn);
      outEl.appendChild(row);
    });
  } catch (e) {
    showError(e instanceof Error ? e.message : "Request failed");
  } finally {
    runBtn.disabled = false;
  }
});

void loadSettings();
