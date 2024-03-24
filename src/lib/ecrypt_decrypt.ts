export const createKeys = async () => {
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
  const publicKey = await crypto.subtle.exportKey("jwk", keys.publicKey);
  const privateKey = await crypto.subtle.exportKey("jwk", keys.privateKey);

  return { privateKey, publicKey };
};

export const encrypt = async (
  message: string,
  publicKey: string
): Promise<string> => {
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
  const encodedMessage = encoder.encode(message);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    importedPublicKey,
    encodedMessage
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

export const decrypt = async (encryptedMessage: string): Promise<string> => {
  const privateKey = localStorage.getItem("privateKey");
  if (!privateKey) throw new Error("Private key not found in localStorage.");

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

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    importedPrivateKey,
    Uint8Array.from(atob(encryptedMessage), (c) => c.charCodeAt(0))
  );

  return new TextDecoder().decode(new Uint8Array(decrypted));
};
