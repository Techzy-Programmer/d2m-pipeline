import * as crypto from 'crypto';

export class APIClient {
  private publicKey: string;
  baseUrl: string;

  constructor(publicKey: string, baseUrl: string) {
    this.publicKey = publicKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Generates a cryptographically secure random AES key.
   * @param length Length of the key in bytes.
   * @returns Random AES key as a Buffer.
   */
  private generateAESKey(length = 32): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Encrypts data using AES-256-CBC.
   * @param data Data to encrypt.
   * @param key AES key.
   * @returns Base64 encoded IV + encrypted data.
   */
  private encryptWithAES(data: Buffer, key: Buffer): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const combined = Buffer.concat([iv, encrypted]);

    return combined.toString('base64');
  }

  /**
   * Encrypts the AES key using an RSA public key.
   * @param aesKey AES key to encrypt.
   * @returns Base64 encoded encrypted AES key.
   */
  private encryptAESKeyWithRSA(aesKey: Buffer): string {
    const encrypted = crypto.publicEncrypt(
      {
        key: this.publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      aesKey
    );

    return encrypted.toString('base64');
  }

  /**
   * Encrypts and sends data to the specified endpoint.
   * @param endpoint API endpoint.
   * @param data JSON data to send.
   * @param options Additional fetch options.
   * @returns Promise resolving with the fetch Response.
   */
  async sendEncrypted(endpoint: string, data: Record<string, any>, options: RequestInit = {}): Promise<Response> {
    try {
      const aesKey = this.generateAESKey();
      const jsonData = Buffer.from(JSON.stringify(data));
      const encryptedKey = this.encryptAESKeyWithRSA(aesKey);
      const encryptedData = this.encryptWithAES(jsonData, aesKey);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'text/plain',
          'X-Encryption-Key': encryptedKey,
          ...options.headers,
        },

        body: encryptedData,
        method: 'POST',
        ...options,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
      }

      throw error;
    }
  }
}
