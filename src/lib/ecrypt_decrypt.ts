import { ContentType } from "@/types";
import CryptoJS from "crypto-js";

export const createAsymmetricKeys = async (): Promise<{
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}> => {
  // Generate a new key pair
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // Extractable
    ["encrypt", "decrypt"]
  );

  // Export both the public and private keys to JWK format
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("jwk", keys.publicKey),
    crypto.subtle.exportKey("jwk", keys.privateKey),
  ]);

  return { privateKey, publicKey };
};

export const createSymetricKey = async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 128,
    },
    true,
    ["encrypt", "decrypt"]
  );

  return await crypto.subtle.exportKey("raw", key);
};

export const encryptSymetricKeyWithPublicKey = async (
  symetricKey: ArrayBuffer,
  publicKey: string
): Promise<string> => {
  try {
    const importedPublicKey = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(publicKey) as JsonWebKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );

    const encryptedSymetricKey = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      importedPublicKey,
      symetricKey
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedSymetricKey)));
  } catch (error: any) {
    throw new Error("Error encrypting message: " + error);
  }
};

export const decryptSymetricKeyWithPrivateKey = async (
  encryptedSymetricKey: string,
  privateKey: CryptoKey
): Promise<string> => {
  try {
    const decryptedSymetricKey = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      Uint8Array.from(atob(encryptedSymetricKey), (c) => c.charCodeAt(0))
    );

    return new TextDecoder().decode(new Uint8Array(decryptedSymetricKey));
  } catch (error: any) {
    console.log(error);
    throw new Error(error);
  }
};

export const decryptMessage = async (
  encryptedMessage: string,
  encryptedSymetricKey: string,
  privateKey: CryptoKey,
  contentType: ContentType
): Promise<any> => {
  try {
    const decryptedSymetricKey = await decryptSymetricKeyWithPrivateKey(
      encryptedSymetricKey,
      privateKey
    );
    // decrypt encrypted message to WordArray
    const decryptedData = CryptoJS.AES.decrypt(
      encryptedMessage,
      decryptedSymetricKey
    );

    if (contentType === "AUDIO" || contentType === "IMAGE") {
      // Convert WordArray to Uint8Array
      const uint8Array = new Uint8Array(decryptedData.words.length * 4);
      let offset = 0;
      for (let i = 0; i < decryptedData.words.length; i++) {
        const word = decryptedData.words[i];
        uint8Array[offset++] = word >> 24;
        uint8Array[offset++] = (word >> 16) & 0xff;
        uint8Array[offset++] = (word >> 8) & 0xff;
        uint8Array[offset++] = word & 0xff;
      }

      // Create Blob from Uint8Array
      return new Blob([uint8Array], {
        type: contentType === "AUDIO" ? "audio/webm;codecs=opus" : "image/webp",
      });
    } else if (contentType === "TEXT") {
      //convert WordArray to string
      return decryptedData.toString(CryptoJS.enc.Utf8) as string;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error decrypting message: " + error);
  }
};

export const encryptMessage = async (
  message: string | Blob,
  encryptedSymetricKey: string,
  privateKey: CryptoKey
): Promise<string | Object> => {
  try {
    const decryptedSymetricKey = await decryptSymetricKeyWithPrivateKey(
      encryptedSymetricKey!,
      privateKey!
    );

    if (typeof message === "string") {
      // Encrypt string message
      return CryptoJS.AES.encrypt(message, decryptedSymetricKey).toString();
    } else {
      // Encrypt Blob message
      const reader = new FileReader();
      reader.readAsArrayBuffer(message);

      // Wait for FileReader to load
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => resolve();
        reader.onerror = reject;
      });

      const wordArray = CryptoJS.lib.WordArray.create(
        reader.result as ArrayBuffer
      );
      const cipherParams = CryptoJS.AES.encrypt(
        wordArray,
        decryptedSymetricKey
      );

      return extractEncryptionData(cipherParams);
      // return JSON.stringify(extractEncryptionData(cipherParams));
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error encrypting message: " + error);
  }
};

function extractEncryptionData(cipherParams: any) {
  const necessaryData = {
    ciphertext: cipherParams.ciphertext.words,
    key: cipherParams.key.words,
    iv: cipherParams.iv.words,
    keySize: cipherParams.algorithm.keySize,
  };
  return necessaryData;
}

export const encryptPrivateKeyWithPassword = async ({
  privateKey,
  password,
}: {
  privateKey: JsonWebKey;
  password: string;
}): Promise<ArrayBuffer> => {
  try {
    // Convert the password string to an ArrayBuffer/Uint8Array
    const passwordBuffer = new TextEncoder().encode(password);

    // Hash the password to derive a fixed salt and IV
    const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);
    const hashArray = new Uint8Array(hashBuffer);

    // Use the first 16 bytes as the salt
    const salt = hashArray.slice(0, 16);
    // Use the next 12 bytes as the IV
    const iv = hashArray.slice(16, 28);

    // Derive a key from the password using PBKDF2 (password based key derivation function 2)
    const importedKey = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      importedKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Convert jwk to string
    const privateKeyString = JSON.stringify(privateKey);

    // Convert string to ArrayBuffer/Uint8Array
    const privateKeyBuffer = new TextEncoder().encode(privateKeyString);

    const encryptedPrivateKey = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        length: 256,
        iv,
      },
      derivedKey,
      privateKeyBuffer
    );

    return encryptedPrivateKey;
  } catch (error) {
    throw new Error("Error encrypting private key: " + error);
  }
};

export const decryptPrivateKeyWithPassword = async ({
  encryptedPrivateKey,
  password,
}: {
  encryptedPrivateKey: ArrayBuffer;
  password: string;
}): Promise<JsonWebKey | null> => {
  try {
    const passwordBuffer = new TextEncoder().encode(password);

    // Hash the password to derive a fixed salt and IV
    const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);
    const hashArray = new Uint8Array(hashBuffer);

    // Use the first 16 bytes as the salt
    const salt = hashArray.slice(0, 16);
    // Use the next 12 bytes as the IV
    const iv = hashArray.slice(16, 28);

    const importedKey = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      importedKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    const privateKeyBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        length: 256,
        iv,
      },
      derivedKey,
      encryptedPrivateKey
    );

    // Decode the ArrayBuffer as UTF-8
    const privateKeyString = new TextDecoder().decode(privateKeyBuffer);

    // Parse the JSON string to get the original JWK
    const privateKey: JsonWebKey = JSON.parse(privateKeyString);

    return privateKey;
  } catch (error) {
    console.log("Error decrypting private key: " + error);
    return null;
  }
};

export const importPrivateKeyAsNonExtractable = async (
  privateKey: JsonWebKey
): Promise<CryptoKey> => {
  const newPrivateKey = await crypto.subtle.importKey(
    "jwk",
    privateKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false, // Private key should be non-extractable
    ["decrypt"]
  );

  return newPrivateKey;
};
