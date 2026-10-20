(() => {
  "use strict";

  const region = document.querySelector("[data-reader-actions]");
  if (!region) return;
  const canonical = document.querySelector('link[rel="canonical"]');
  let url;
  try {
    url = new URL(canonical?.getAttribute("href"));
    if (url.origin !== "https://jhsoftlabs.com") return;
    url.search = "";
    url.hash = "";
  } catch { return; }

  const controls = region.querySelector("[data-share-controls]");
  const copy = region.querySelector("[data-copy-link]");
  const select = region.querySelector("[data-select-url]");
  const share = region.querySelector("[data-native-share]");
  const fallback = region.querySelector("[data-share-fallback]");
  const field = region.querySelector("[data-share-url]");
  const status = region.querySelector("[data-share-status]");
  field.value = url.href;
  field.readOnly = true;
  controls.hidden = false;
  share.hidden = typeof navigator.share !== "function";
  let busy = false;

  function manualSelection(message = "자동 공유를 사용할 수 없습니다. 아래 주소를 직접 선택해 복사하세요.") {
    fallback.hidden = false;
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    status.textContent = message;
  }

  async function perform(kind) {
    if (busy) return;
    busy = true;
    copy.disabled = true;
    share.disabled = true;
    controls.setAttribute("aria-busy", "true");
    status.textContent = "";
    try {
      if (kind === "share") {
        await navigator.share({ title: document.title, url: url.href });
        status.textContent = "브라우저 공유를 마쳤습니다.";
      } else {
        if (typeof navigator.clipboard?.writeText !== "function") {
          manualSelection();
          return;
        }
        await navigator.clipboard.writeText(url.href);
        fallback.hidden = true;
        status.textContent = "글의 정규 링크를 복사했습니다.";
      }
    } catch (error) {
      if (kind === "share" && error?.name === "AbortError") {
        status.textContent = "공유를 취소했습니다.";
      } else {
        manualSelection();
      }
    } finally {
      busy = false;
      copy.disabled = false;
      share.disabled = false;
      controls.removeAttribute("aria-busy");
    }
  }

  copy.addEventListener("click", () => perform("copy"));
  share.addEventListener("click", () => perform("share"));
  select.addEventListener("click", () => manualSelection("주소를 선택했습니다. 직접 복사하거나 필요한 부분을 선택하세요."));
})();
