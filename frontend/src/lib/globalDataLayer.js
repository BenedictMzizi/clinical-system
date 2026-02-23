import { supabase } from "./supabase";


const WRITE_QUEUE_KEY = "GLOBAL_WRITE_QUEUE";
const READ_CACHE_KEY = "GLOBAL_READ_CACHE";
const SYNC_META_KEY = "GLOBAL_SYNC_META";


function loadJSON(key, fallback) {

  try {

    const raw = localStorage.getItem(key);

    return raw ? JSON.parse(raw) : fallback;

  }
  catch {

    return fallback;

  }

}

function saveJSON(key, value) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

}

function generateHash(operation) {

  return btoa(
    JSON.stringify(operation)
  );

}


export function getWriteQueue() {

  return loadJSON(
    WRITE_QUEUE_KEY,
    []
  );

}

export function setWriteQueue(queue) {

  saveJSON(
    WRITE_QUEUE_KEY,
    queue
  );

}

export function clearWriteQueue() {

  saveJSON(
    WRITE_QUEUE_KEY,
    []
  );

}

export function enqueueOperation(operation) {

  const queue = getWriteQueue();

  const op = {

    id: crypto.randomUUID(),

    hash: generateHash(operation),

    created_at:
      new Date().toISOString(),

    retry_count: 0,

    status: "pending",

    ...operation

  };

  const exists =
    queue.find(q =>
      q.hash === op.hash
    );

  if (!exists) {

    queue.push(op);

    setWriteQueue(queue);

  }

}


export function getReadCache() {

  return loadJSON(
    READ_CACHE_KEY,
    {}
  );

}

export function setReadCache(cache) {

  saveJSON(
    READ_CACHE_KEY,
    cache
  );

}

export function cacheTableData(
  table,
  data
) {

  const cache =
    getReadCache();

  cache[table] = {

    data,

    cached_at:
      new Date().toISOString()

  };

  setReadCache(cache);

}

export function getCachedTable(table) {

  const cache =
    getReadCache();

  return cache[table]?.data || [];

}

export function updateCachedRow(
  table,
  match,
  newData
) {

  const cache =
    getReadCache();

  if (!cache[table])
    return;

  cache[table].data =
    cache[table].data.map(row => {

      let matchFound = true;

      for (const key in match) {

        if (row[key] !== match[key]) {

          matchFound = false;

          break;

        }

      }

      return matchFound
        ? { ...row, ...newData }
        : row;

    });

  setReadCache(cache);

}


export async function globalSelect(
  table,
  queryBuilder = null
) {

  try {

    let query =
      supabase
        .from(table)
        .select("*");

    if (queryBuilder)
      query =
        queryBuilder(query);

    const {
      data,
      error
    } = await query;

    if (error)
      throw error;

    cacheTableData(
      table,
      data
    );

    return data;

  }
  catch {

    console.warn(
      "Offline mode → using cache:",
      table
    );

    return getCachedTable(
      table
    );

  }

}


export async function globalInsert(
  table,
  data
) {

  try {

    const {
      error
    } =
      await supabase
        .from(table)
        .insert(data);

    if (error)
      throw error;

    return true;

  }
  catch {

    enqueueOperation({

      type: "insert",

      table,

      data

    });

    return false;

  }

}

export async function globalUpdate(
  table,
  match,
  data
) {

  try {

    let query =
      supabase
        .from(table)
        .update(data);

    Object.entries(match)
      .forEach(([k, v]) => {

        query =
          query.eq(k, v);

      });

    const {
      error
    } = await query;

    if (error)
      throw error;

    updateCachedRow(
      table,
      match,
      data
    );

    return true;

  }
  catch {

    enqueueOperation({

      type: "update",

      table,

      match,

      data

    });

    return false;

  }

}

export async function globalDelete(
  table,
  match
) {

  try {

    let query =
      supabase
        .from(table)
        .delete();

    Object.entries(match)
      .forEach(([k, v]) => {

        query =
          query.eq(k, v);

      });

    const {
      error
    } = await query;

    if (error)
      throw error;

    return true;

  }
  catch {

    enqueueOperation({

      type: "delete",

      table,

      match

    });

    return false;

  }

}

export async function globalRPC(
  functionName,
  params
) {

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        functionName,
        params
      );

    if (error)
      throw error;

    return data;

  }
  catch {

    enqueueOperation({

      type: "rpc",

      functionName,

      params

    });

    return null;

  }

}

export function getLastSyncTime() {

  const meta =
    loadJSON(
      SYNC_META_KEY,
      {}
    );

  return meta.lastSync || null;

}

export function setLastSyncTime() {

  const meta =
    loadJSON(
      SYNC_META_KEY,
      {}
    );

  meta.lastSync =
    new Date().toISOString();

  saveJSON(
    SYNC_META_KEY,
    meta
  );

}

export function getSystemStatus() {

  return {

    online:
      navigator.onLine,

    queuedOperations:
      getWriteQueue().length,

    lastSync:
      getLastSyncTime()

  };

}
