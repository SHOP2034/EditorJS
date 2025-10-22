// main.js
import * as Files from './modules/files.js';
import * as Storage from './modules/storage.js';
import * as Sandbox from './modules/sandbox.js';
import { renderFileList } from './modules/editor-ui.js';

// DOM refs
const fileInput = document.getElementById('fileInput');
const filesListEl = document.getElementById('filesList');
const codeEditor = document.getElementById('codeEditor');
const currentFileName = document.getElementById('currentFileName');
const fileMeta = document.getElementById('fileMeta');
const saveBtn = document.getElementById('saveBtn');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const runBtn = document.getElementById('runBtn');
const stopBtn = document.getElementById('stopBtn');
const restoreBtn = document.getElementById('restoreBtn');
const previewCanvas = document.getElementById('previewCanvas');
const runStatus = document.getElementById('runStatus');
const frameCounterEl = document.getElementById('frameCounter');

const ctx = previewCanvas.getContext('2d');

// app state
const files = []; // { name, text, originalText, size, date, dirty, blobURL? }
let activeIndex = -1;
let running = false;
let importedModuleHandle = null;
let animationHandle = null;
let frameCount = 0;
let drawFunction = null; // function ref to exported draw

// helper: update canvas DPR & size
function adjustCanvas(){
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = previewCanvas.clientWidth || 640;
  const h = previewCanvas.clientHeight || 360;
  previewCanvas.width = Math.floor(w * DPR);
  previewCanvas.height = Math.floor(h * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', adjustCanvas);
adjustCanvas();

// file input handler
fileInput.addEventListener('change', async (e)=>{
  const fileList = Array.from(e.target.files || []);
  for (const f of fileList){
    try{
      const txt = await Files.readTextFile(f);
      const entry = {
        name: f.name,
        text: txt,
        originalText: txt,
        size: f.size,
        date: new Date().toLocaleString(),
        dirty: false
      };
      files.push(entry);
    } catch(err){
      console.error('read file error', err);
      alert('Error leyendo archivo: ' + f.name);
    }
  }
  e.target.value = '';
  if (files.length && activeIndex === -1) activeIndex = 0;
  refreshUI();
});

// UI: file list selection event
filesListEl.addEventListener('file-select', (ev)=>{
  const idx = ev.detail.index;
  setActiveFile(idx);
});

// set active file
function setActiveFile(idx){
  if (idx < 0 || idx >= files.length) return;
  activeIndex = idx;
  const f = files[activeIndex];
  codeEditor.value = f.text;
  currentFileName.textContent = f.name;
  fileMeta.textContent = `${f.size} bytes • ${f.date}`;
  f.dirty = false;
  refreshUI();
}

// refresh file list UI
function refreshUI(){
  renderFileList(files, filesListEl, activeIndex);
  updateButtons();
}

// detect editor changes
codeEditor.addEventListener('input', ()=>{
  if (activeIndex < 0) return;
  const f = files[activeIndex];
  f.text = codeEditor.value;
  f.dirty = (f.text !== f.originalText);
  refreshUI();
});

// save/download current file
saveBtn.addEventListener('click', ()=>{
  if (activeIndex < 0) return alert('Selecciona un archivo primero.');
  const f = files[activeIndex];
  Files.downloadFile(f.name, f.text, 'application/javascript');
  // update original text marker
  f.originalText = f.text;
  f.dirty = false;
  refreshUI();
});

// save to localStorage
saveLocalBtn.addEventListener('click', ()=>{
  if (activeIndex < 0) return alert('Selecciona un archivo primero.');
  const f = files[activeIndex];
  const base = f.name.replace(/\W+/g,'_');
  const ok = Storage.saveLocal(base, f.text);
  if (ok) {
    alert('Guardado local OK: key=' + base);
  } else {
    alert('No se pudo guardar localmente.');
  }
});

// restore original (from when file was loaded in session)
restoreBtn.addEventListener('click', ()=>{
  if (activeIndex < 0) return;
  const f = files[activeIndex];
  if (!confirm('Restaurar contenido original del archivo?')) return;
  f.text = f.originalText;
  f.dirty = false;
  codeEditor.value = f.text;
  refreshUI();
});

// RUN: import module from current text and try to call draw function
runBtn.addEventListener('click', async ()=>{
  if (activeIndex < 0) return alert('Selecciona un archivo para ejecutar.');
  await stopRunning();
  const f = files[activeIndex];
  runStatus.textContent = 'Compilando...';
  try{
    const { module, revoke } = await Sandbox.importModuleFromString(f.text, f.name);
    // keep handle so we can revoke when stopping
    importedModuleHandle = { module, revoke };

    // Try to detect a draw-like function: drawDuck, draw, default export, or any function
    drawFunction = null;
    if (module.drawDuck) drawFunction = module.drawDuck;
    else if (module.draw) drawFunction = module.draw;
    else if (module.default && typeof module.default === 'function') drawFunction = module.default;
    else {
      // pick the first exported function if exists
      const keys = Object.keys(module);
      for (const k of keys){
        if (typeof module[k] === 'function') { drawFunction = module[k]; break; }
      }
    }

    if (!drawFunction) {
      runStatus.textContent = 'No hay función exportada ejecutable';
      alert('El módulo no exporta una función reconocible (ej: export function drawDuck(...) ).');
      importedModuleHandle.revoke();
      importedModuleHandle = null;
      return;
    }

    // start animation loop that calls drawFunction with a simple API
    runStatus.textContent = 'Running';
    running = true;
    frameCount = 0;

    function loop(){
      if (!running) return;
      frameCount++;
      frameCounterEl.textContent = String(frameCount);
      adjustCanvas();
      // clear
      ctx.clearRect(0,0, previewCanvas.width, previewCanvas.height);
      // build a simple BIRD object in CSS pixels coords (center)
      const bird = { x: previewCanvas.clientWidth / 2, y: previewCanvas.clientHeight / 2 };
      // Call drawFunction safely
      try{
        // drawFunction may expect different args; we try to call in common signatures
        // Prefer drawDuck(ctx, BIRD, flap, headTilt, tailTilt, featherVibe)
        const flap = Math.sin(frameCount * 0.12) * 0.8;
        const headTilt = Math.sin(frameCount * 0.06) * 0.12;
        const tailTilt = Math.sin(frameCount * 0.04) * 0.06;
        const featherVibe = Math.sin(frameCount * 0.09) * 0.08;
        // call with ctx (CanvasRenderingContext2D) but note module might expect context scaled differently
        const ret = drawFunction(ctx, bird, flap, headTilt, tailTilt, featherVibe);
        // allow drawFunction to optionally return a promise (async)
        if (ret && typeof ret.then === 'function'){
          ret.catch(err => {
            console.error('error in draw promise', err);
            stopRunning();
            alert('Error ejecutando la función (ver consola).');
          });
        }
      } catch(err){
        console.error('error while running drawFunction', err);
        stopRunning();
        alert('Error ejecutando la función: ' + (err && err.message || err));
        return;
      }
      animationHandle = requestAnimationFrame(loop);
    }
    loop();

  } catch(err){
    console.error('import error', err);
    runStatus.textContent = 'Error';
    alert('Error al importar módulo: ' + (err.message || err));
    if (importedModuleHandle && importedModuleHandle.revoke) importedModuleHandle.revoke();
    importedModuleHandle = null;
  }
});

// STOP
async function stopRunning(){
  if (animationHandle) { cancelAnimationFrame(animationHandle); animationHandle = null; }
  running = false;
  runStatus.textContent = 'Idle';
  drawFunction = null;
  frameCounterEl.textContent = '0';
  if (importedModuleHandle){
    try{ importedModuleHandle.revoke(); } catch(e){}
    importedModuleHandle = null;
  }
}

// stop button
stopBtn.addEventListener('click', async ()=>{
  await stopRunning();
});

// try to auto-load from localStorage a saved version of a file (optional)
function tryLoadFromLocalStorage(name){
  const base = name.replace(/\W+/g,'_');
  const saved = Storage.loadLocal(base);
  return saved;
}

// when selecting first active file, attempt to restore local saved edit if exists
function maybeRestoreLocalEdits(index){
  if (index < 0 || index >= files.length) return;
  const f = files[index];
  const saved = tryLoadFromLocalStorage(f.name);
  if (saved){
    if (confirm(`Se encontró una versión guardada localmente para "${f.name}". ¿Restaurarla?`)){
      f.text = saved;
      f.dirty = true;
      codeEditor.value = f.text;
    }
  }
}

// set active on initial load if any files exist
function initFromFiles(){
  if (files.length > 0 && activeIndex === -1){
    activeIndex = 0;
    setActiveFile(0);
  }
}

// utility: setActiveFile wrapper to expose maybeRestoreLocalEdits
function setActiveFile(idx){
  if (idx < 0 || idx >= files.length) return;
  activeIndex = idx;
  const f = files[activeIndex];
  // try restore local
  const saved = tryLoadFromLocalStorage(f.name);
  if (saved && saved !== f.text){
    if (confirm(`Se encontró una versión local guardada de ${f.name}. Restaurarla?`)){
      f.text = saved;
    }
  }
  codeEditor.value = f.text;
  currentFileName.textContent = f.name;
  fileMeta.textContent = `${f.size} bytes • ${f.date}`;
  f.dirty = false;
  refreshUI();
}

// helper small wrapper to call renderFileList
function refreshUI(){ renderFileList(files, filesListEl, activeIndex); updateButtons(); }

// enable/disable buttons
function updateButtons(){
  const hasActive = activeIndex >= 0;
  saveBtn.disabled = !hasActive;
  saveLocalBtn.disabled = !hasActive;
  runBtn.disabled = !hasActive;
  restoreBtn.disabled = !hasActive;
}

// before unload, auto save dirty file to localStorage
window.addEventListener('beforeunload', ()=>{
  if (activeIndex >= 0){
    const f = files[activeIndex];
    if (f.dirty){
      const key = f.name.replace(/\W+/g,'_');
      try{ Storage.saveLocal(key, f.text); } catch(e){}
    }
  }
});

// initial UI
refreshUI();

// expose stop on unload
window.addEventListener('unload', ()=> { try{ stopRunning(); }catch(e){} });

