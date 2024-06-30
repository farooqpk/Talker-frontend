import { StoreNameIDB } from "@/types";
import { openDB, DBSchema } from "idb";

// Define the database schema
interface MyDB extends DBSchema {
  keys: {
    key: string;
    value: any;
  };
}

// Define the database schema for cache
interface MediaCacheDB extends DBSchema {
  cache: {
    key: string;
    value: any;
  };
}

// Open the database
const dbPromise = async () => {
  return await openDB<MyDB>(StoreNameIDB.PRIVATE_KEY_DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
    },
  });
};

// Open the database for cache
const dbPromiseMediaCache = async () => {
  return await openDB<MediaCacheDB>(StoreNameIDB.MEDIA_CACHE_DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache");
      }
    },
  });
};

// Function to add a value to the store
export const addValueToStoreIDB = async (key: string, value: any) => {
  const db = await dbPromise();
  return db.put("keys", value, key);
};

// Function to get a value from the store
export const getValueFromStoreIDB = async (key: string):Promise<CryptoKey> => {
  const db = await dbPromise();
  return db.get("keys", key);
};

// Function to delete a value from the store
export const deleteValueFromStoreIDB = async (key: string) => {
  const db = await dbPromise();
  return db.delete("keys", key);
};


// Functions for interacting with the cache store
export const addValueToMediaCacheIDB = async (key: string, value: ArrayBuffer) => {
  const db = await dbPromiseMediaCache();
  return db.put("cache", value, key);
};

export const getValueFromMediaCacheIDB = async (key: string):Promise<ArrayBuffer> => {
  const db = await dbPromiseMediaCache();
  return db.get("cache", key);
};

export const deleteValueFromMediaCacheIDB = async (key: string) => {
  const db = await dbPromiseMediaCache();
  return db.delete("cache", key);
};