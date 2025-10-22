export function saveToLocal(key, data) {
  localStorage.setItem(key, data);
}

export function loadFromLocal(key) {
  return localStorage.getItem(key);
}