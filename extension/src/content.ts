chrome.runtime.onMessage.addListener(
  (message: { type?: string }, _sender, sendResponse: (r: unknown) => void) => {
    if (message?.type === "GET_JD") {
      const text = document.body?.innerText ?? "";
      const title = document.title ?? "";
      sendResponse({
        text: text.slice(0, 120_000),
        title,
        href: window.location.href,
      });
      return true;
    }
    return false;
  },
);
