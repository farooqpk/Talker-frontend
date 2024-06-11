import { ContentType } from "@/types";

export const createAsymmetricKeys = async (): Promise<{
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}> => {
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

export const createSymetricKey = async (): Promise<ArrayBuffer> => {
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
): Promise<ArrayBuffer> => {
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

    return encryptedSymetricKey;
  } catch (error: any) {
    throw new Error("Error encrypting message: " + error);
  }
};

export const decryptSymetricKeyWithPrivateKey = async (
  encryptedSymetricKey: ArrayBuffer,
  privateKey: CryptoKey
): Promise<CryptoKey> => {
  try {
    const decryptedSymetricKey = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedSymetricKey
    );

    const importedSymetricKey = await crypto.subtle.importKey(
      "raw",
      decryptedSymetricKey,
      {
        name: "AES-GCM",
        length: 128,
      },
      true,
      ["encrypt", "decrypt"]
    );

    return importedSymetricKey;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const decryptMessage = async (
  encryptedMessage: ArrayBuffer,
  encryptedSymetricKey: ArrayBuffer,
  privateKey: CryptoKey,
  contentType: ContentType
): Promise<string | Blob> => {
  try {
    const decryptedSymetricKey = await decryptSymetricKeyWithPrivateKey(
      encryptedSymetricKey,
      privateKey
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
      },
      decryptedSymetricKey,
      encryptedMessage
    );

    let decryptedData: Blob | string = "";

    switch (contentType) {
      case ContentType.TEXT:
        decryptedData = new TextDecoder().decode(decryptedBuffer);
        break;
      case ContentType.AUDIO:
        // create blob from arraybuffer
        decryptedData = new Blob([decryptedBuffer], {
          type: "audio/webm;codecs=opus",
        });
        break;
      case ContentType.IMAGE:
        // create blob from arraybuffer
        decryptedData = new Blob([decryptedBuffer], {
          type: "image/webp",
        });
        break;

      default:
        break;
    }

    return decryptedData;
  } catch (error) {
    throw new Error("Error decrypting message: " + error);
  }
};

export const encryptMessage = async (
  message: string | Blob,
  encryptedSymetricKey: ArrayBuffer,
  privateKey: CryptoKey
): Promise<ArrayBuffer> => {
  try {
    const decryptedSymetricKey = await decryptSymetricKeyWithPrivateKey(
      encryptedSymetricKey!,
      privateKey!
    );

    let encryptedMessageBuffer: ArrayBuffer;

    if (typeof message === "string") {
      // Encrypt string message
      const messageBuffer = new TextEncoder().encode(message);
      encryptedMessageBuffer = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
        },
        decryptedSymetricKey,
        messageBuffer
      );
    } else {
      // Encrypt Blob message
      const reader = new FileReader();
      reader.readAsArrayBuffer(message);

      // Wait for FileReader to load
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => resolve();
        reader.onerror = reject;
      });

      const readerResult = reader.result;

      if (!readerResult) {
        throw new Error("Error reading file");
      }

      encryptedMessageBuffer = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
        },
        decryptedSymetricKey,
        readerResult as ArrayBuffer
      );
    }

    return encryptedMessageBuffer;
  } catch (error) {
    console.log(error);
    throw new Error("Error encrypting message: " + error);
  }
};

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
