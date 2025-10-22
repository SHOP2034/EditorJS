export async function importModuleFromString(code, filenameHint="module.js") {
  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  try {
    const mod = await import(url + `#${Date.now()}`);
    return { module: mod, revoke: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}