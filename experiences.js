(() => {
  "use strict";

  document.querySelectorAll("[data-csv-demo]").forEach((demo) => {
    const controls = demo.querySelector(".demo-controls");
    const buttons = [...demo.querySelectorAll("[data-demo-mode]")];
    const panels = [...demo.querySelectorAll("[data-demo-panel]")];
    const announcement = demo.querySelector("[data-demo-announcement]");
    let selected = "number";

    function render(announce = false) {
      buttons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.demoMode === selected));
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.demoPanel !== selected; });
      if (announce) {
        announcement.textContent = selected === "number"
          ? "숫자로 해석: 원본 00123이 123으로 바뀌어 앞자리 0이 사라집니다. 설명용 예시입니다."
          : "텍스트로 유지: 원본 상품 코드 00123이 그대로 남습니다. 설명용 예시입니다.";
      }
    }

    controls.addEventListener("click", (event) => {
      const button = event.target.closest("[data-demo-mode]");
      if (!button || !buttons.includes(button) || selected === button.dataset.demoMode) return;
      selected = button.dataset.demoMode;
      render(true);
    });

    render();
    controls.hidden = false;
    demo.classList.add("is-interactive");
  });
})();
