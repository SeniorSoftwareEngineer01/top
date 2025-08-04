// This file uses 'use client' because it needs to interact with the browser's IndexedDB.
// However, we are not exporting any React components, so the directive is not strictly necessary
// but it helps clarify the execution context.

import type { ParsedMessage } from './parser';
import type { AIMessage } from '@/components/query-interface';

const DB_NAME = 'WhatsAnalyzerDB';
const DB_VERSION = 1;
const ARCHIVE_STORE_NAME = 'chatArchive';
const AI_CONVO_STORE_NAME = 'aiConversation';

interface StoredArchive {
  id: number;
  name: string;
  chatText: string;
  parsedChat: ParsedMessage[];
  // Storing ArrayBuffer directly is supported in IndexedDB
  mediaContent: Record<string, { url: string; buffer: ArrayBuffer }>;
  createdAt: Date;
}

interface StoredAiConversation {
    id: number;
    conversation: AIMessage[];
    createdAt: Date;
}


function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported.'));
        return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ARCHIVE_STORE_NAME)) {
        db.createObjectStore(ARCHIVE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(AI_CONVO_STORE_NAME)) {
        db.createObjectStore(AI_CONVO_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
  });
}

export async function saveChatArchive(
  name: string,
  chatText: string,
  parsedChat: ParsedMessage[],
  mediaContent: Record<string, { url: string; buffer: ArrayBuffer }>
): Promise<void> {
    const db = await openDb();
    const transaction = db.transaction(ARCHIVE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ARCHIVE_STORE_NAME);

    // IndexedDB doesn't store object URLs, so we recreate them on load.
    // We only store the buffer.
    const storableMediaContent: Record<string, { url: string, buffer: ArrayBuffer }> = {};
    for (const fileName in mediaContent) {
        storableMediaContent[fileName] = {
            url: '', // This will be recreated on load
            buffer: mediaContent[fileName].buffer
        };
    }
    
    // We only want to keep one archive at a time. Clear the old one.
    const clearRequest = store.clear();
    
    return new Promise((resolve, reject) => {
        clearRequest.onsuccess = () => {
             const archive: Omit<StoredArchive, 'id'> = {
                name,
                chatText,
                parsedChat,
                mediaContent: storableMediaContent,
                createdAt: new Date(),
            };
            const addRequest = store.add(archive);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        };
        clearRequest.onerror = () => reject(clearRequest.error);
    });
}

export async function getLatestChatArchive(): Promise<StoredArchive | null> {
    const db = await openDb();
    const transaction = db.transaction(ARCHIVE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(ARCHIVE_STORE_NAME);
    const cursorRequest = store.openCursor(null, 'prev'); // Get the last item

    return new Promise((resolve, reject) => {
        cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (cursor) {
                const archive = cursor.value as StoredArchive;
                // Recreate blob URLs
                for (const fileName in archive.mediaContent) {
                    const media = archive.mediaContent[fileName];
                    const extension = fileName.split('.').pop()?.toLowerCase() || '';
                    const mimeType = getMimeTypeFromExtension(extension);
                    const blob = new Blob([media.buffer], { type: mimeType });
                    media.url = URL.createObjectURL(blob);
                }
                resolve(archive);
            } else {
                resolve(null);
            }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
    });
}

export async function saveAiConversation(conversation: AIMessage[]): Promise<void> {
    const db = await openDb();
    const transaction = db.transaction(AI_CONVO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(AI_CONVO_STORE_NAME);
    const clearRequest = store.clear();

    // We can't store the buffer of the context message in the AI conversation,
    // as it's already in the main archive. So we create a serializable version.
    const serializableConversation = conversation.map(msg => {
      if (msg.contextMessage) {
        // Create a copy and remove non-serializable parts if they exist
        const contextCopy = { ...msg.contextMessage };
        // The buffer isn't on this object anyway based on ParsedMessage type,
        // but this is good practice.
        return { ...msg, contextMessage: contextCopy };
      }
      return msg;
    });

    return new Promise((resolve, reject) => {
        clearRequest.onsuccess = () => {
            const convo: Omit<StoredAiConversation, 'id'> = {
                conversation: serializableConversation,
                createdAt: new Date(),
            };
            const addRequest = store.add(convo);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        };
        clearRequest.onerror = () => reject(clearRequest.error);
    });
}

export async function getLatestAiConversation(): Promise<AIMessage[] | null> {
    const db = await openDb();
    const transaction = db.transaction(AI_CONVO_STORE_NAME, 'readonly');
    const store = transaction.objectStore(AI_CONVO_STORE_NAME);
    const cursorRequest = store.openCursor(null, 'prev');

    return new Promise((resolve, reject) => {
        cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (cursor) {
                resolve((cursor.value as StoredAiConversation).conversation);
            } else {
                resolve(null);
            }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
    });
}

export async function clearDb(): Promise<void> {
    const db = await openDb();
    const archiveTx = db.transaction(ARCHIVE_STORE_NAME, 'readwrite');
    const archiveStore = archiveTx.objectStore(ARCHIVE_STORE_NAME);
    const archiveClearReq = archiveStore.clear();

    const aiTx = db.transaction(AI_CONVO_STORE_NAME, 'readwrite');
    const aiStore = aiTx.objectStore(AI_CONVO_STORE_NAME);
    const aiClearReq = aiStore.clear();

    await Promise.all([
        new Promise<void>((res, rej) => { archiveClearReq.onsuccess = () => res(); archiveClearReq.onerror = () => rej(archiveClearReq.error); }),
        new Promise<void>((res, rej) => { aiClearReq.onsuccess = () => res(); aiClearReq.onerror = () => rej(aiClearReq.error); }),
    ]);
}


function getMimeTypeFromExtension(extension: string): string {
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'mp3':
      return 'audio/mpeg';
    case 'ogg':
        return 'audio/ogg';
    case 'wav':
        return 'audio/wav';
    case 'opus':
        return 'audio/opus';
    case 'm4a':
        return 'audio/mp4';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
};
