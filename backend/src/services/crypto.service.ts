import argon2 from 'argon2';
import crypto from 'crypto';
import {config} from "../config/env";

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes IV                                                                                                                                                                
const AUTH_TAG_LENGTH = 16; // 16 bytes Auth Tag                                                                                                                                                         
                                                                                                                                                                                                            
export interface EncryptedPayload {                                                                                                                                                                        
    encryptedContent: string; // Base64                                                                                                                                                                      
    iv: string; // Hex                                                                                                                                                                         
    authTag: string; // Hex                                                                                                                                                                         
}                                                                                                                                                                                                          
                                                                                                                                                                                                            
export class CryptoService {                                                                                                                                                                               
    // Hash Mật Khẩu / Private PIN bằng thuật toán Argon2id (Chống GPU Brute-Force)                                                                                                                          
    static async hashData(plainText: string): Promise<string> {                                                                                                                                              
    return await argon2.hash(plainText, {                                                                                                                                                                  
        type: argon2.argon2id,                                                                                                                                                                               
        memoryCost: 2 ** 16, // 64MB RAM cho mỗi lần hash                                                                                                                                                    
        timeCost: 3, // 3 vòng lặp                                                                                                                                                                   
        parallelism: 1,                                                                                                                                                                                      
    });                                                                                                                                                                                                    
    }                                                                                                                                                                                                        
                                                                                                                                                                                                            
    // Verify Mật Khẩu / PIN so với chuỗi Hash Argon2id                                                                                                                                                      
    static async verifyHash(hash: string, plainText: string): Promise<boolean> {                                                                                                                             
    try {                                                                                                                                                                                                  
        return await argon2.verify(hash, plainText);                                                                                                                                                         
    } catch (error) {                                                                                                                                                                                      
        return false;                                                                                                                                                                                        
    }                                                                                                                                                                                                      
    }                                                                                                                                                                                                        
                                                                                                                                                                                                            
    // Mã hóa ghi chú riêng tư bằng AES-256-GCM                                                                                                                                                              
    static encryptText(plainText: string): EncryptedPayload {                                                                                                                                                
    // Tạo ngẫu nhiên IV 16 bytes riêng cho mỗi lượt mã hóa                                                                                                                                             
    const iv = crypto.randomBytes(IV_LENGTH);                                                                                                                                                              
                                                                                                                                                                                                            
    // Tạo Master Key 32 bytes từ Secret Config                                                                                                                                                         
    const key = crypto.scryptSync(config.SECURITY.PRIVATE_NOTE_MASTER_KEY, 'salt_note_secret', 32);                                                                                                        
                                                                                                                                                                                                            
    // Khởi tạo Cipher AES-256-GCM                                                                                                                                                                      
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);                                                                                                                                              
                                                                                                                                                                                                            
    // Mã hóa nội dung                                                                                                                                                                                  
    let encrypted = cipher.update(plainText, 'utf8', 'base64');                                                                                                                                            
    encrypted += cipher.final('base64');                                                                                                                                                                   
                                                                                                                                                                                                            
    // Lấy Authentication Tag (Xác thực chống sửa đổi dữ liệu)                                                                                                                                          
    const authTag = cipher.getAuthTag().toString('hex');                                                                                                                                                   
                                                                                                                                                                                                            
    return {                                                                                                                                                                                               
        encryptedContent: encrypted,                                                                                                                                                                         
        iv: iv.toString('hex'),                                                                                                                                                                              
        authTag: authTag,                                                                                                                                                                                    
    };                                                                                                                                                                                                     
    }                                                                                                                                                                                                        
                                                                                                                                                                                                            
    // Giải mã ghi chú riêng tư                                                                                                                                                                              
    static decryptText(encryptedContent: string, ivHex: string, authTagHex: string): string {                                                                                                                
    const iv = Buffer.from(ivHex, 'hex');                                                                                                                                                                  
    const authTag = Buffer.from(authTagHex, 'hex');                                                                                                                                                        
    const key = crypto.scryptSync(config.SECURITY.PRIVATE_NOTE_MASTER_KEY, 'salt_note_secret', 32);                                                                                                        
                                                                                                                                                                                                            
    // 1. Khởi tạo Decipher                                                                                                                                                                                
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);                                                                                                                                          
    decipher.setAuthTag(authTag);                                                                                                                                                                          
                                                                                                                                                                                                            
    // 2. Giải mã dữ liệu                                                                                                                                                                                  
    let decrypted = decipher.update(encryptedContent, 'base64', 'utf8');                                                                                                                                   
    decrypted += decipher.final('utf8');                                                                                                                                                                   
                                                                                                                                                                                                            
    return decrypted;                                                                                                                                                                                      
    }                                                                                                                                                                                                        
}    