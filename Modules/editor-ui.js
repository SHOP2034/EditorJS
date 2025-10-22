import { readFiles } from "./files.js";
import { saveToLocal } from "./storage.js";

export function setupEditorUI(onCodeLoaded, onRunClicked) {
  const input = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  const codeArea = document.getElementById("codeArea");

  let files = [];

  input.addEventListener("change", async e => {
    files = await readFiles(e.target.files);
    renderList();
  });

  function renderList() {
    fileList.innerHTML = "";
    files.forEach((f, i) => {
      const li = document.createElement("li");
      li.textContent = f.name;
      li.onclick = () => selectFile(i);
      fileList.appendChild(li);
    });
  }

  function selectFile(index) {
    fileList.querySelectorAll("li").forEach(li => li.classList.remove("active"));
    const selected = fileList.children[index];
    selected.classList.add("active");
    codeArea.value = files[index].content;
    onCodeLoaded(files[index].content);
  }

  document.getElementById("saveBtn").onclick = () => {
    const blob = new Blob([codeArea.value], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileList.querySelector(".active")?.textContent || "script.js";
    a.click();
  };

  document.getElementById("saveLocalBtn").onclick = () => {
    saveToLocal("lastCode", codeArea.value);
    alert("Código guardado en localStorage.");
  };

  document.getElementById("runBtn").onclick = () => {
    onCodeLoaded(codeArea.value);
    onRunClicked();
  };
}