// modules/files.js
// Funciones para leer archivos .js del file input, descargar y manejar memoria temporal.

export async function readTextFile(file){
  return new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = ()=> resolve(fr.result);
    fr.onerror = ()=> reject(fr.error);
    fr.readAsText(file);
  });
}

export function downloadFile(filename, text, mime='application/javascript'){
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}