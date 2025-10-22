// modules/storage.js
const PREFIX = 'js_edit_v1_';

export function saveLocal(key, content){
  try{
    localStorage.setItem(PREFIX + key, content);
    return true;
  } catch(e){
    console.warn('saveLocal failed', e);
    return false;
  }
}

export function loadLocal(key){
  try{
    return localStorage.getItem(PREFIX + key);
  } catch(e){
    return null;
  }
}

export function removeLocal(key){
  try{ localStorage.removeItem(PREFIX + key); } catch(e){}
}