import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'pdf-study-annotations';
const STORE_NAME = 'annotations';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
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

export function usePDFAnnotations() {
  const getPageKey = (fileName: string, pageNum: number): string => {
    return `${fileName}__page__${pageNum}`;
  };

  const loadAnnotations = async (fileName: string, pageNum: number): Promise<any> => {
    try {
      const db = await getDB();
      const key = getPageKey(fileName, pageNum);
      const res = await db.get(STORE_NAME, key);
      return res || null;
    } catch (e) {
      console.error('Failed to load annotations from IndexedDB', e);
      return null;
    }
  };

  const saveAnnotations = async (fileName: string, pageNum: number, fabricJSON: any): Promise<void> => {
    try {
      const db = await getDB();
      const key = getPageKey(fileName, pageNum);
      await db.put(STORE_NAME, fabricJSON, key);
    } catch (e) {
      console.error('Failed to save annotations to IndexedDB', e);
    }
  };

  const clearPageAnnotations = async (fileName: string, pageNum: number): Promise<void> => {
    try {
      const db = await getDB();
      const key = getPageKey(fileName, pageNum);
      await db.delete(STORE_NAME, key);
    } catch (e) {
      console.error('Failed to delete page annotations', e);
    }
  };

  const exportAllAnnotations = async (fileName: string): Promise<string> => {
    try {
      const db = await getDB();
      const keys = await db.getAllKeys(STORE_NAME);
      const fileKeys = keys.filter(k => typeof k === 'string' && k.startsWith(`${fileName}__page__`));
      
      const payload: Record<string, any> = {};
      for (const k of fileKeys) {
        const val = await db.get(STORE_NAME, k);
        payload[k as string] = val;
      }
      return JSON.stringify(payload, null, 2);
    } catch (e) {
      console.error('Failed to export annotations', e);
      return '{}';
    }
  };

  const importAllAnnotations = async (fileName: string, rawJSON: string): Promise<boolean> => {
    try {
      const db = await getDB();
      const payload = JSON.parse(rawJSON);
      
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      for (const [key, value] of Object.entries(payload)) {
        if (key.startsWith(`${fileName}__page__`)) {
          await store.put(value, key);
        }
      }
      await tx.done;
      return true;
    } catch (e) {
      console.error('Failed to import annotations', e);
      return false;
    }
  };

  return {
    loadAnnotations,
    saveAnnotations,
    clearPageAnnotations,
    exportAllAnnotations,
    importAllAnnotations,
  };
}
