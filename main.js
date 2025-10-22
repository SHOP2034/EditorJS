import { setupEditorUI } from "./modules/editor-ui.js";
import { importModuleFromString } from "./modules/sandbox.js";

let currentCode = "";
let currentModule = null;
let running = false;
let ctx, canvas, frame = 0, anim;

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("previewCanvas");
  ctx = canvas.getContext("2d");
  setupEditorUI(onCodeLoaded, onRunClicked);
  
  // alternar vistas
  const toggleBtn = document.getElementById("toggleView");
  const editorView = document.getElementById("editorView");
  const previewView = document.getElementById("previewView");
  toggleBtn.addEventListener("click", () => {
    const showingEditor = !editorView.classList.contains("hidden");
    editorView.classList.toggle("hidden", showingEditor);
    previewView.classList.toggle("hidden", !showingEditor);
    toggleBtn.textContent = showingEditor ? "✏️ Ver código" : "👁️ Ver vista previa";
  });
});

function onCodeLoaded(code) {
  currentCode = code;
}

async function onRunClicked() {
  if (!currentCode.trim()) return;
  cancelAnimationFrame(anim);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("status").textContent = "Ejecutando...";

  try {
    const { module, revoke } = await importModuleFromString(currentCode);
    currentModule = module;
    frame = 0;
    running = true;
    animateDuck();
    revoke();
  } catch (err) {
    console.error(err);
    document.getElementById("status").textContent = "Error: " + err.message;
  }
}

function animateDuck() {
  if (!running || !currentModule?.drawDuck) return;
  frame++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const BIRD = { x: 160 + Math.sin(frame / 10) * 30, y: 120 };
  currentModule.drawDuck(ctx, BIRD, frame / 10, 0, 0, 0);
  document.getElementById("status").textContent = "Frame: " + frame;
  anim = requestAnimationFrame(animateDuck);
}
