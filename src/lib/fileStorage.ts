import { openDB } from 'idb';

const DB_NAME = 'studyvibe-files-db';
const STORE_NAME = 'files';

let dbPromise: Promise<any> | null = null;

function getFilesDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

// Helper to convert base64 dataURL to Blob for efficient binary IndexedDB storage
export function dataURLtoBlob(dataurl: string): Blob {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Failed to convert base64 to Blob', err);
    return new Blob([dataurl], { type: 'text/plain' });
  }
}

// Convert a File/Blob/Base64 to Blob and save to IndexedDB
export async function saveFileToStorage(id: string, fileData: string | Blob | File): Promise<string> {
  try {
    const db = await getFilesDB();
    let blobToSave: Blob | File;

    if (typeof fileData === 'string') {
      if (fileData.startsWith('data:')) {
        blobToSave = dataURLtoBlob(fileData);
      } else {
        blobToSave = new Blob([fileData], { type: 'text/plain' });
      }
    } else {
      blobToSave = fileData;
    }

    await db.put(STORE_NAME, blobToSave, id);
    return `indexeddb://${id}`;
  } catch (err) {
    console.error('Failed to save file to IndexedDB', err);
    return typeof fileData === 'string' ? fileData : '';
  }
}

// Retrieve file data as a local Session Object URL (to load into iframes/img/audio tags)
export async function getFileObjectURL(id: string): Promise<string | null> {
  try {
    const db = await getFilesDB();
    const data = await db.get(STORE_NAME, id);
    if (!data) return null;

    if (data instanceof Blob) {
      return URL.createObjectURL(data);
    }
    return null;
  } catch (err) {
    console.error('Failed to retrieve file from IndexedDB', err);
    return null;
  }
}

// Delete media asset from IndexedDB
export async function deleteFileFromStorage(id: string): Promise<void> {
  try {
    const db = await getFilesDB();
    await db.delete(STORE_NAME, id);
  } catch (err) {
    console.error('Failed to delete file from IndexedDB', err);
  }
}
