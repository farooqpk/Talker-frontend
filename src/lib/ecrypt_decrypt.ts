import { ContentType } from "@/types";
import CryptoJS from "crypto-js";

export const createAssymetricKeys = async () => {
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("jwk", keys.publicKey),
    crypto.subtle.exportKey("jwk", keys.privateKey),
  ]);

  return { privateKey, publicKey };
};

export const createSymetricKey = async () => {
  const key = CryptoJS.lib.WordArray.random(128 / 8);
  // Convert the key to a Base64 string for storage or transmission
  const base64Key = CryptoJS.enc.Base64.stringify(key);

  return base64Key;
};

export const encryptSymetricKey = async (
  symetricKey: string,
  publicKey: string
): Promise<string> => {
  try {
    const importedPublicKey = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(publicKey),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );

    const encoder = new TextEncoder();
    const encodedSymetricKey = encoder.encode(symetricKey);
    const encryptedSymetricKey = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      importedPublicKey,
      encodedSymetricKey
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedSymetricKey)));
  } catch (error: any) {
    console.log(error.message);
    throw new Error("Error encrypting message: " + error);
  }
};

export const decryptSymetricKey = async (
  encryptedSymetricKey: string,
  privateKey: string
): Promise<string> => {
  try {
    const importedPrivateKey = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(privateKey),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );

    const decryptedSymetricKey = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      importedPrivateKey,
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
  privateKey: string,
  contentType: ContentType
): Promise<any> => {
  try {
    const decryptedSymetricKey = await decryptSymetricKey(
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
  privateKey: string
): Promise<string> => {
  let encodedMessage;

  try {
    const decryptedSymetricKey = await decryptSymetricKey(
      encryptedSymetricKey!,
      privateKey!
    );

    if (typeof message === "string") {
      // Encrypt string message
      encodedMessage = CryptoJS.AES.encrypt(
        message,
        decryptedSymetricKey
      ).toString();
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
      encodedMessage = CryptoJS.AES.encrypt(
        wordArray,
        decryptedSymetricKey
      ).toString();
    }

    return encodedMessage;
  } catch (error) {
    console.log(error);
    throw new Error("Error encrypting message: " + error);
  }
};
