import type { ParsedMessage } from './parser';
import type { AIMessage } from '@/components/query-interface';

const DB_NAME = 'WhatsAnalyzerDB';
const DB_VERSION = 2; // Incremented version for schema change
const CONVERSATIONS_STORE_NAME = 'conversations';

export interface Conversation {
  id: number;
  name: string;
  description: string;
  chatText: string;
  parsedChat: ParsedMessage[];
  mediaContent: Record<string, { url: string; buffer: ArrayBuffer }>;
  aiConversation: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
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
      const oldVersion = event.oldVersion;

      if (oldVersion < 2) {
        // Drop old stores if they exist
        if (db.objectStoreNames.contains('chatArchive')) {
            db.deleteObjectStore('chatArchive');
        }
        if (db.objectStoreNames.contains('aiConversation')) {
            db.deleteObjectStore('aiConversation');
        }

        // Create new conversations store
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE_NAME)) {
            const store = db.createObjectStore(CONVERSATIONS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            store.createIndex('createdAt', 'createdAt', { unique: false });
        }
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

// Create a new conversation
export async function createConversation(
  data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'aiConversation'>
): Promise<number> {
    const db = await openDb();
    const transaction = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);

    const newConversation: Omit<Conversation, 'id'> = {
        ...data,
        aiConversation: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const request = store.add(newConversation);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

// Get a single conversation by ID
export async function getConversation(id: number): Promise<Conversation | null> {
    const db = await openDb();
    const transaction = db.transaction(CONVERSATIONS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result ? (request.result as Conversation) : null);
        };
        request.onerror = () => reject(request.error);
    });
}

// Get all conversations, sorted by most recently updated
export async function getAllConversations(): Promise<Conversation[]> {
    const db = await openDb();
    const transaction = db.transaction(CONVERSATIONS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const conversations = request.result as Conversation[];
            // Sort by createdAt descending
            conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            resolve(conversations);
        };
        request.onerror = () => reject(request.error);
    });
}

// Save or update the AI part of a conversation
export async function saveAiConversation(id: number, aiConversation: AIMessage[]): Promise<void> {
    const db = await openDb();
    const transaction = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);

    const getRequest = store.get(id);

    return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
            const data = getRequest.result;
            if (data) {
                // Ensure chartData which may not be serializable is handled
                const serializableConversation = aiConversation.map(msg => {
                    if (msg.chartData) {
                       return { ...msg, chartData: JSON.parse(JSON.stringify(msg.chartData)) };
                    }
                    return msg;
                });
                data.aiConversation = serializableConversation;
                data.updatedAt = new Date();
                const putRequest = store.put(data);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                reject(new Error(`Conversation with id ${id} not found.`));
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Delete a conversation
export async function deleteConversation(id: number): Promise<void> {
    const db = await openDb();
    const transaction = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);
    const request = store.delete(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Update a conversation's name
export async function updateConversationName(id: number, name: string): Promise<void> {
    const db = await openDb();
    const transaction = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);
    const getRequest = store.get(id);

    return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
            const data = getRequest.result;
            if (data) {
                data.name = name;
                data.updatedAt = new Date();
                const putRequest = store.put(data);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                reject(new Error(`Conversation with id ${id} not found.`));
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Clear the entire database (for development or a hard reset)
export async function clearDb(): Promise<void> {
    const db = await openDb();
    const transaction = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);
    const request = store.clear();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
