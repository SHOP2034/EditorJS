export async function readFiles(fileList) {
  const files = [];
  for (let f of fileList) {
    const text = await f.text();
    files.push({ name: f.name, content: text });
  }
  return files;
}