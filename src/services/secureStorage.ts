/**
 * Secure storage service for sensitive data like API keys
 * Uses Web Crypto API to encrypt data before storing in localStorage
 */

import { SECURITY_CONFIG } from '../config/app';

interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
}

export class SecureStorage {
  private static readonly STORAGE_PREFIX = SECURITY_CONFIG.storagePrefix;
  private static readonly KEY_DERIVATION_ITERATIONS = SECURITY_CONFIG.encryptionIterations;
  
  /**
   * Derives an encryption key from user's device and session
   * Uses a combination of user agent, screen resolution, and timezone as entropy
   */
  private static async deriveKey(salt: Uint8Array): Promise<CryptoKey> {
    // Create a seed from device characteristics (not secret, but unique per device/browser)
    const deviceSeed = [
      navigator.userAgent,
      screen.width.toString(),
      screen.height.toString(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      window.location.hostname
    ].join('|');
    
    const encoder = new TextEncoder();
    const seedData = encoder.encode(deviceSeed);
    
    // Import the seed as a key for PBKDF2
    const baseKey = await crypto.subtle.importKey(
      'raw',
      seedData,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derive a strong encryption key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.KEY_DERIVATION_ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Encrypts data using AES-GCM
   */
  static async encryptData(data: string): Promise<EncryptedData> {
    try {
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(data);
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive encryption key
      const key = await this.deriveKey(salt);
      
      // Encrypt the data
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        plaintext
      );
      
      // Convert to base64 for storage
      const encryptedArray = new Uint8Array(ciphertext);
      const encryptedBase64 = btoa(String.fromCharCode.apply(null, Array.from(encryptedArray)));
      const ivBase64 = btoa(String.fromCharCode.apply(null, Array.from(iv)));
      const saltBase64 = btoa(String.fromCharCode.apply(null, Array.from(salt)));
      
      return {
        encryptedData: encryptedBase64,
        iv: ivBase64,
        salt: saltBase64
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypts data using AES-GCM
   */
  static async decryptData(encryptedData: EncryptedData): Promise<string> {
    try {
      // Convert from base64
      const ciphertext = Uint8Array.from(atob(encryptedData.encryptedData), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
      const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
      
      // Derive the same encryption key
      const key = await this.deriveKey(salt);
      
      // Decrypt the data
      const plaintext = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertext
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(plaintext);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Securely stores data in localStorage with encryption
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await this.encryptData(value);
      const storageKey = this.STORAGE_PREFIX + key;
      localStorage.setItem(storageKey, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to store data securely');
    }
  }
  
  /**
   * Retrieves and decrypts data from localStorage
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        return null;
      }
      
      const encrypted: EncryptedData = JSON.parse(storedData);
      return await this.decryptData(encrypted);
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      // If decryption fails, remove the corrupted data
      this.removeItem(key);
      return null;
    }
  }
  
  /**
   * Removes data from secure storage
   */
  static removeItem(key: string): void {
    const storageKey = this.STORAGE_PREFIX + key;
    localStorage.removeItem(storageKey);
  }
  
  /**
   * Checks if an item exists in secure storage
   */
  static hasItem(key: string): boolean {
    const storageKey = this.STORAGE_PREFIX + key;
    return localStorage.getItem(storageKey) !== null;
  }
  
  /**
   * Migrates existing plain-text API key to encrypted storage
   */
  static async migrateApiKey(): Promise<boolean> {
    try {
      const existingKey = localStorage.getItem('anthropic_api_key');
      if (existingKey && !this.hasItem('anthropic_api_key')) {
        await this.setItem('anthropic_api_key', existingKey);
        localStorage.removeItem('anthropic_api_key'); // Remove plain-text version
        return true;
      }
      return false;
    } catch (error) {
      console.error('API key migration failed:', error);
      return false;
    }
  }
  
  /**
   * Clears all secure storage data (useful for logout/reset)
   */
  static clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}