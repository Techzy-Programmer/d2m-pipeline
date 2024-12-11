import * as crypto from 'crypto';

type ReqData = Record<string, any> | Blob | File | ArrayBuffer;

export class APIClient {
  private static baseUrl: string;
  private static publicKey: string;

  static setConfig(publicKey: string, baseUrl: string) {
    APIClient.publicKey = publicKey;
    APIClient.baseUrl = baseUrl;
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
        key: APIClient.publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      aesKey
    );

    return encrypted.toString('base64');
  }

  /**
   * Encrypts and sends data or a file to the specified endpoint.
   * @param endpoint API endpoint.
   * @param data JSON data or File to send.
   * @param options Additional fetch options.
   * @returns Promise resolving with the fetch Response.
   */
  async sendEncrypted(endpoint: string, data: ReqData, options: RequestInit = {}): Promise<Response> {
    try {
      let contentType = 'application/octet-stream';
      let method = "PUT";

      const isCooked = data instanceof Blob || data instanceof File;
      const isRawBuff = data instanceof ArrayBuffer || data instanceof Buffer;

      const dataBuffer = isRawBuff ?
        Buffer.from(data)
        : isCooked ?
          Buffer.from(await data.arrayBuffer())
          : (
              method = "POST",
              contentType = 'text/plain',
              Buffer.from(JSON.stringify(data))
            );

      const aesKey = this.generateAESKey();
      const encryptedKey = this.encryptAESKeyWithRSA(aesKey);
      const encryptedData = this.encryptWithAES(dataBuffer, aesKey);

      const fetchOptions: RequestInit = {
        body: encryptedData,
        ...options,
        method,

        headers: {
          'X-Encryption-Key': encryptedKey,
          'Content-Type': contentType,
          ...(options.headers || {}),
        },
      };

      const response = await fetch(`${APIClient.baseUrl}${endpoint}`, fetchOptions);

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
      }

      throw error;
    }
  }
}
