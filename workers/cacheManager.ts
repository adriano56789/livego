// Gerenciador de cache com suporte a IndexedDB
const DB_NAME = 'translationCacheDB';
const STORE_NAME = 'translations';
const DB_VERSION = 1;

interface CacheEntry {
  text: string;
  timestamp: number;
  language: string;
  originalText: string;
}

class CacheManager {
  private db: IDBDatabase | null = null;
  private inMemoryCache = new Map<string, CacheEntry>();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        this.cleanupOldEntries().then(resolve).catch(console.error);
      };

      request.onerror = (event) => {
        console.error('Falha ao abrir o banco de dados:', (event.target as IDBRequest).error);
        this.isInitialized = true; // Continua com cache em memória
        resolve();
      };
    });

    return this.initPromise;
  }

  private async withDB<T>(
    operation: (store: IDBObjectStore) => IDBRequest<T>,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<T> {
    if (!this.isInitialized) {
      await this.initPromise;
    }

    if (!this.db) {
      throw new Error('Banco de dados não inicializado');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], mode);
      const store = transaction.objectStore(STORE_NAME);
      
      transaction.oncomplete = () => {};
      transaction.onerror = (event) => {
        console.error('Erro na transação:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };

      const request = operation(store);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error('Erro na operação:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async get(key: string): Promise<CacheEntry | null> {
    // Tenta buscar na memória primeiro
    const cached = this.inMemoryCache.get(key);
    if (cached) return cached;

    try {
      const entry = await this.withDB<CacheEntry | undefined>((store) => 
        store.get(key)
      );
      
      if (entry) {
        // Atualiza o cache em memória
        this.inMemoryCache.set(key, entry);
      }
      
      return entry || null;
    } catch (error) {
      console.warn('Erro ao buscar do cache:', error);
      return null;
    }
  }

  async set(key: string, value: CacheEntry): Promise<void> {
    // Atualiza o cache em memória
    this.inMemoryCache.set(key, value);

    try {
      await this.withDB(
        (store) => store.put({
          ...value,
          key,
        }),
        'readwrite'
      );
    } catch (error) {
      console.warn('Erro ao salvar no cache:', error);
    }
  }

  async delete(key: string): Promise<void> {
    // Remove da memória
    this.inMemoryCache.delete(key);

    try {
      await this.withDB(
        (store) => store.delete(key),
        'readwrite'
      );
    } catch (error) {
      console.warn('Erro ao remover do cache:', error);
    }
  }

  async cleanupOldEntries(expiryTime: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    const threshold = now - expiryTime;

    try {
      const transaction = this.db?.transaction([STORE_NAME], 'readwrite');
      if (!transaction) return;

      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(threshold);
      
      return new Promise((resolve, reject) => {
        const request = index.openCursor(range);
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            this.inMemoryCache.delete(cursor.value.key);
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Erro ao limpar entradas antigas:', error);
    }
  }

  async clear(): Promise<void> {
    this.inMemoryCache.clear();
    
    try {
      await this.withDB(
        (store) => store.clear(),
        'readwrite'
      );
    } catch (error) {
      console.warn('Erro ao limpar o cache:', error);
    }
  }
}

export const cacheManager = new CacheManager();
