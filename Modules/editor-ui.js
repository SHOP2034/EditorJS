// modules/editor-ui.js
// UI helpers: render file list entries and update editor state.
// No DOM creation of main layout; trabaja con nodos existentes.

export function renderFileList(files, containerEl, activeIndex){
  containerEl.innerHTML = '';
  files.forEach((f,i)=>{
    const div = document.createElement('div');
    div.className = 'fileItem' + (i === activeIndex ? ' active' : '');
    const name = document.createElement('div');
    name.textContent = f.name + (f.dirty ? ' *' : '');
    name.style.fontWeight = '700';
    const meta = document.createElement('div');
    meta.className = 'small';
    meta.textContent = `${f.size} bytes • ${f.date}`;
    div.appendChild(name);
    div.appendChild(meta);
    div.addEventListener('click', ()=> {
      const ev = new CustomEvent('file-select', { detail: { index: i } });
      containerEl.dispatchEvent(ev);
    });
    containerEl.appendChild(div);
  });
}

