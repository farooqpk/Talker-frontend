import { StoreNameIDB } from "@/types";
import { openDB, DBSchema } from "idb";

// Define the database schema
interface MyDB extends DBSchema {
  keys: {
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

// Function to add a value to the store
export const addValueToStoreIDB = async (key: string, value: any) => {
  const db = await dbPromise();
  return db.put("keys", value, key);
};

// Function to get a value from the store
export const getValueFromStoreIDB = async (key: string) => {
  const db = await dbPromise();
  return db.get("keys", key);
};

// Function to delete a value from the store
export const deleteValueFromStoreIDB = async (key: string) => {
  const db = await dbPromise();
  return db.delete("keys", key);
};
