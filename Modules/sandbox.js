// modules/sandbox.js
// Ejecuta dinámicamente código JS en un módulo blob y expone sus exports.
// Usa import() sobre un Blob URL para mantenerlo como module (scope aislado).
// Devuelve { module, revoke } donde module es el namespace importado.

export async function importModuleFromString(code, filenameHint='module.js'){
  // Simple wrapper to create Blob URL and import as module
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  try {
    const mod = await import(url + `#${Date.now()}`); // cache-busting
    return { module: mod, revoke: ()=>URL.revokeObjectURL(url) };
  } catch(err){
    // ensure revoke on error
    URL.revokeObjectURL(url);
    throw err;
  }
}

