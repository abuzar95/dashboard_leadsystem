type MetaValue = string | number | boolean | null

const DB_NAME = 'lead_dashboard_cache'
const DB_VERSION = 1
const DATA_STORE = 'data'
const META_STORE = 'meta'

export const TTL_MS = {
  prospects: 60 * 60 * 1000, // 1 hour
  users: 24 * 60 * 60 * 1000, // 1 day
  skills: 24 * 60 * 60 * 1000,
  linkedin_profiles: 24 * 60 * 60 * 1000,
  dashboard_stats: 60 * 60 * 1000,
} as const

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DATA_STORE)) db.createObjectStore(DATA_STORE)
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getFromStore<T = unknown>(db: IDBDatabase, storeName: string, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.get(key)
    req.onsuccess = () => resolve((req.result as T) ?? null)
    req.onerror = () => reject(req.error)
  })
}

function putToStore(db: IDBDatabase, storeName: string, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getCachedData<T = unknown>(key: string): Promise<T | null> {
  const db = await openDb()
  return getFromStore<T>(db, DATA_STORE, key)
}

export async function setCachedData(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  await putToStore(db, DATA_STORE, key, value)
}

export async function getMeta(key: string): Promise<MetaValue> {
  const db = await openDb()
  return getFromStore<MetaValue>(db, META_STORE, key)
}

export async function setMeta(key: string, value: MetaValue): Promise<void> {
  const db = await openDb()
  await putToStore(db, META_STORE, key, value)
}

export async function markSynced(dataset: string): Promise<void> {
  const now = Date.now()
  await Promise.all([
    setMeta(`last_synced_${dataset}`, now),
    setMeta('last_synced_all', now),
  ])
}

export async function isStale(dataset: keyof typeof TTL_MS): Promise<boolean> {
  const last = await getMeta(`last_synced_${dataset}`)
  if (typeof last !== 'number') return true
  return Date.now() - last > TTL_MS[dataset]
}

export async function cacheFirstLoad<T>(
  dataset: keyof typeof TTL_MS,
  cacheKey: string,
  fetcher: () => Promise<T>
): Promise<{ data: T | null; stale: boolean }> {
  const [cached, stale] = await Promise.all([
    getCachedData<T>(cacheKey),
    isStale(dataset),
  ])

  if (cached && !stale) return { data: cached, stale: false }
  if (cached && stale) {
    return { data: cached, stale: true }
  }

  const fresh = await fetcher()
  await Promise.all([setCachedData(cacheKey, fresh), markSynced(dataset)])
  return { data: fresh, stale: false }
}

export async function syncIfStale<T>(
  dataset: keyof typeof TTL_MS,
  cacheKey: string,
  fetcher: () => Promise<T>,
  force = false
): Promise<{ synced: boolean; data: T | null }> {
  const stale = force ? true : await isStale(dataset)
  if (!stale) {
    return { synced: false, data: await getCachedData<T>(cacheKey) }
  }
  const fresh = await fetcher()
  await Promise.all([setCachedData(cacheKey, fresh), markSynced(dataset)])
  return { synced: true, data: fresh }
}
