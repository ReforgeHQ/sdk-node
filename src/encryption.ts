import forge from "node-forge";

const SEPARATOR: string = "--";
const KEY_LENGTH = 32; // 32 bytes for AES-256
const IV_LENGTH = 12; // 12 bytes for GCM
const TAG_LENGTH = 16; // 16 bytes for GCM tag

export function randomUUID(): string {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // Node 18 doesn't support randomUUID from the Web Crypto API (comes in v19)
  const bytes = forge.random.getBytesSync(16);
  const hex = forge.util.bytesToHex(bytes);

  // Format as standard UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function generateNewHexKey(): string {
  const key = forge.random.getBytesSync(KEY_LENGTH);
  return forge.util.bytesToHex(key);
}

export function encrypt(plainText: string, keyStringHex: string): string {
  if (keyStringHex.length !== KEY_LENGTH * 2) {
    throw new Error(
      `Invalid key length. Key must be a ${
        KEY_LENGTH * 2
      }-character hex string.`
    );
  }

  if (plainText === "") {
    return `${SEPARATOR}${SEPARATOR}`;
  }

  // Convert hex key to bytes
  const keyBytes = forge.util.hexToBytes(keyStringHex);

  // Generate random IV
  const iv = forge.random.getBytesSync(IV_LENGTH);

  // Create cipher
  const cipher = forge.cipher.createCipher("AES-GCM", keyBytes);
  cipher.start({
    iv,
    tagLength: TAG_LENGTH * 8, // tagLength is in bits
  });

  // Encrypt the plaintext
  cipher.update(forge.util.createBuffer(plainText, "utf8"));
  cipher.finish();

  // Get the encrypted data and authentication tag
  const encrypted = cipher.output;
  const tag = cipher.mode.tag;

  // Convert to hex strings
  const encryptedHex = forge.util.bytesToHex(encrypted.getBytes());
  const ivHex = forge.util.bytesToHex(iv);
  const tagHex = forge.util.bytesToHex(tag.getBytes());

  return `${encryptedHex}${SEPARATOR}${ivHex}${SEPARATOR}${tagHex}`;
}

export function decrypt(encryptedString: string, keyStringHex: string): string {
  if (keyStringHex.length !== KEY_LENGTH * 2) {
    throw new Error(
      `Invalid key length. Key must be a ${
        KEY_LENGTH * 2
      }-character hex string.`
    );
  }

  const parts = encryptedString.split(SEPARATOR);

  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted string. Must contain encrypted data, IV, and auth tag."
    );
  }

  const encryptedDataPart = parts[0];
  const ivPart = parts[1];
  const authTagPart = parts[2];

  if (
    encryptedDataPart === undefined ||
    ivPart === undefined ||
    authTagPart === undefined
  ) {
    throw new Error("Invalid encrypted string. All parts must be defined.");
  }

  if (encryptedDataPart === "") {
    return "";
  }

  // Convert hex strings to bytes
  const keyBytes = forge.util.hexToBytes(keyStringHex);
  const encryptedBytes = forge.util.hexToBytes(encryptedDataPart);
  const ivBytes = forge.util.hexToBytes(ivPart);
  const tagBytes = forge.util.hexToBytes(authTagPart);

  // Create decipher
  const decipher = forge.cipher.createDecipher("AES-GCM", keyBytes);
  decipher.start({
    iv: ivBytes,
    tagLength: TAG_LENGTH * 8, // tagLength is in bits
    tag: forge.util.createBuffer(tagBytes),
  });

  // Decrypt the data
  decipher.update(forge.util.createBuffer(encryptedBytes));
  const success = decipher.finish();

  if (!success) {
    throw new Error("Authentication tag verification failed");
  }

  return decipher.output.toString();
}
