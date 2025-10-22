// modules/editor-ui.js
// Encapsula lógica de la UI: file list, part select, panel de propiedades.
// Exporta initEditorUI(appContext) que devuelve callbacks útiles.

import { downloadJson, exportCanvasPNG } from './files.js';
import { saveToLocal, loadFromLocal, clearAllLocal } from './storage.js';

// appContext: { canvas, ctx, getDuckParts, setDuckParts, getSelectedPartKey, setSelectedPartKey, requestRender, center }
// devuelve funciones de UI para main

export function initEditorUI(appContext){
  const filePicker = document.getElementById('filePicker');
  const fileListEl = document.getElementById('fileList');
  const partSelect = document.getElementById('partSelect');
  const propsContainer = document.getElementById('propsContainer');
  const fileTitle = document.getElementById('fileTitle');
  const partLabel = document.getElementById('partLabel');

  // estado local de archivos cargados en memoria
  const loadedFiles = []; // {name, data, thumb}

  function refreshFileList(){
    fileListEl.innerHTML = '';
    for (let i=0;i<loadedFiles.length;i++){
      const f = loadedFiles[i];
      const div = document.createElement('div');
      div.className = 'fileItem' + (i===0 ? ' selectedFile' : '');
      div.innerHTML = `<img class="thumb" src="${f.thumb}" alt="thumb"/><div style="flex:1"><div style="font-weight:700">${f.name}</div><div style="font-size:12px;color:#666">${f.date}</div></div>`;
      div.addEventListener('click', ()=>{
        // cargarlo como archivo activo
        setActiveFile(i);
      });
      fileListEl.appendChild(div);
    }
  }

  function setActiveFile(index){
    const file = loadedFiles[index];
    if (!file) return;
    fileTitle.textContent = file.name;
    // asigna duckParts (copia profunda para evitar mutaciones externas)
    appContext.setDuckParts(JSON.parse(JSON.stringify(file.data)));
    // guarda en local
    saveToLocal('last_loaded', file.data);
    // refresca partes
    populatePartsSelect();
    appContext.requestRender();
  }

  // populate parts select from current duckParts
  function populatePartsSelect(){
    const duckParts = appContext.getDuckParts();
    partSelect.innerHTML = '';
    const keys = Object.keys(duckParts || {});
    keys.forEach(k=>{
      const opt = document.createElement('option');
      opt.value = k; opt.textContent = duckParts[k].name || k;
      partSelect.appendChild(opt);
    });
    // if there is a previously selected part, keep it if exists
    const sel = appContext.getSelectedPartKey();
    if (sel && keys.includes(sel)) partSelect.value = sel;
    else if (keys.length) {
      partSelect.value = keys[0];
      appContext.setSelectedPartKey(keys[0]);
    } else {
      appContext.setSelectedPartKey(null);
    }
    renderPropsPanel();
    updateInfoLabel();
  }

  function updateInfoLabel(){
    const sel = appContext.getSelectedPartKey();
    const partLabel = document.getElementById('partLabel');
    if (sel) partLabel.textContent = '✓ ' + (appContext.getDuckParts()[sel].name || sel);
    else partLabel.textContent = 'Ninguna parte seleccionada';
  }

  function renderPropsPanel(){
    const sel = appContext.getSelectedPartKey();
    propsContainer.innerHTML = '';
    if (!sel) {
      propsContainer.innerHTML = `<div style="color:#666">Selecciona una parte para editar sus propiedades.</div>`;
      return;
    }
    const part = appContext.getDuckParts()[sel];
    // inputs: x,y,rotation (grados), scale
    const elX = createNumberRow('X', part.x, (v)=>{ part.x = v; appContext.requestRender(); saveToLocal('last_loaded', appContext.getDuckParts()); });
    const elY = createNumberRow('Y', part.y, (v)=>{ part.y = v; appContext.requestRender(); saveToLocal('last_loaded', appContext.getDuckParts()); });
    const elRot = createNumberRow('Rot (°)', (part.rotation||0) * 180 / Math.PI, (v)=>{ part.rotation = v * Math.PI / 180; appContext.requestRender(); saveToLocal('last_loaded', appContext.getDuckParts()); }, 1);
    const elScale = createNumberRow('Scale', part.scale, (v)=>{ part.scale = Math.max(0.01, v); appContext.requestRender(); saveToLocal('last_loaded', appContext.getDuckParts()); }, 0.01);
    const resetBtn = document.createElement('button'); resetBtn.className='btn warn'; resetBtn.textContent='Reset Parte';
    resetBtn.addEventListener('click', ()=>{
      // si existe default declarado en appContext, resetea solo esa parte
      const defaults = appContext.DEFAULTS || {};
      if (defaults[sel]) {
        Object.assign(part, JSON.parse(JSON.stringify(defaults[sel])));
        appContext.requestRender();
        renderPropsPanel();
        saveToLocal('last_loaded', appContext.getDuckParts());
      } else {
        alert('No hay valores por defecto disponibles para esta parte.');
      }
    });

    propsContainer.appendChild(elX);
    propsContainer.appendChild(elY);
    propsContainer.appendChild(elRot);
    propsContainer.appendChild(elScale);
    propsContainer.appendChild(resetBtn);
  }

  function createNumberRow(labelText, initialValue, onChange, step=0.1){
    const row = document.createElement('div'); row.className='editorRow';
    const label = document.createElement('label'); label.textContent = labelText;
    const input = document.createElement('input'); input.type='number'; input.value = Number(initialValue).toFixed(2);
    input.step = step;
    input.addEventListener('input', ()=> onChange(Number(input.value)));
    row.appendChild(label);
    row.appendChild(input);
    return row;
  }

  // filePicker handling
  filePicker.addEventListener('change', async (e)=>{
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const obj = await readFileAsJson(f);
      // assume duckParts structure
      const canvas = appContext.canvas;
      // draw current duck to temp canvas to make thumb
      appContext.setDuckParts(obj);
      appContext.requestRenderSync(); // render once synchronously so canvas has visuals
      const thumb = canvas.toDataURL('image/png');
      loadedFiles.unshift({ name: f.name, date: new Date().toLocaleString(), data: obj, thumb });
      refreshFileList();
      setActiveFile(0);
      filePicker.value = '';
    } catch(err){
      alert('Error cargando JSON: ' + err.message);
    }
  });

  // helper: read file (using dynamic import to use files.js's reader is fine but kept simple)
  function readFileAsJson(file){
    return new Promise((resolve,reject)=>{
      const fr = new FileReader();
      fr.onload = ()=> {
        try{ resolve(JSON.parse(fr.result)); } catch(e){ reject(e); }
      };
      fr.onerror = ()=> reject(fr.error);
      fr.readAsText(file);
    });
  }

  // actions for save/export/reset/clear
  document.getElementById('saveJsonBtn').addEventListener('click', ()=>{
    const dp = appContext.getDuckParts();
    downloadJson('duck_export.json', dp);
  });

  document.getElementById('exportPngBtn').addEventListener('click', async ()=>{
    await exportCanvasPNG(appContext.canvas, 'duck_export.png');
  });

  document.getElementById('resetFileBtn').addEventListener('click', ()=>{
    if (!confirm('Resetear este archivo a valores por defecto?')) return;
    const defaults = appContext.DEFAULTS || {};
    const dp = appContext.getDuckParts();
    Object.keys(dp).forEach(k=>{
      if (defaults[k]) dp[k] = JSON.parse(JSON.stringify(defaults[k]));
    });
    appContext.requestRender();
    renderPropsPanel();
    saveToLocal('last_loaded', appContext.getDuckParts());
  });

  document.getElementById('clearStorageBtn').addEventListener('click', ()=>{
    if (!confirm('Borrar todos los datos guardados localmente?')) return;
    clearAllLocal();
    alert('Guardado local borrado.');
  });

  // when partSelect changes -> update selected part in appContext and props panel
  partSelect.addEventListener('change', ()=>{
    const key = partSelect.value || null;
    appContext.setSelectedPartKey(key);
    renderPropsPanel();
    updateInfoLabel();
  });

  // expose a small API
  return {
    populatePartsSelect,
    renderPropsPanel,
    refreshFileList,
    setActiveFile,
    loadedFiles,
    updateInfoLabel,
    // helper used by file loader if want to add initial file programmatically:
    addLoadedFile(obj, name='file.json'){
      const thumb = appContext.canvas.toDataURL('image/png');
      loadedFiles.unshift({ name, date:new Date().toLocaleString(), data: obj, thumb });
      refreshFileList();
    }
  };
}

