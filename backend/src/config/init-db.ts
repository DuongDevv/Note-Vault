import { dbPool } from "./database";

export const initDatabase = async (): Promise<void> => {
  const ddlQuery = `                                                                                                                                                                                       
       -- Kích hoạt Extension UUID và Trigram Search                                                                                                                                                          
       CREATE EXTENSION IF NOT EXISTS "uuid-ossp";                                                                                                                                                            
       CREATE EXTENSION IF NOT EXISTS "pg_trgm";                                                                                                                                                              
                                                                                                                                                                                                              
       -- Bảng Users (Tài khoản)                                                                                                                                                                           
       CREATE TABLE IF NOT EXISTS users (                                                                                                                                                                     
           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                                                                                                                                                    
           username VARCHAR(50) UNIQUE NOT NULL,                                                                                                                                                              
           email VARCHAR(100) UNIQUE NOT NULL,                                                                                                                                                                
           password_hash VARCHAR(255) NOT NULL,                                                                                                                                                               
           created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,                                                                                                                                                  
           updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP                                                                                                                                                   
       );                                                                                                                                                                                                     
                                                                                                                                                                                                              
       -- Bảng Profiles (Cài đặt & Hash PIN tab Riêng tư)                                                                                                                                                  
       CREATE TABLE IF NOT EXISTS profiles (                                                                                                                                                                  
           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                                                                                                                                                    
           user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,                                                                                                                               
           display_name VARCHAR(100) NOT NULL,                                                                                                                                                                
           theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),                                                                                                                    
           private_pin_hash VARCHAR(255),                                                                                                                                                                     
           updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP                                                                                                                                                   
       );                                                                                                                                                                                                     
                                                                                                                                                                                                              
       -- Bảng Topics (Chủ đề ghi chú)                                                                                                                                                                     
       CREATE TABLE IF NOT EXISTS topics (                                                                                                                                                                    
           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                                                                                                                                                    
           user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,                                                                                                                                      
           name VARCHAR(100) NOT NULL,                                                                                                                                                                        
           slug VARCHAR(100) NOT NULL,                                                                                                                                                                        
           color VARCHAR(7) DEFAULT '#000000',                                                                                                                                                                
           created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,                                                                                                                                                  
           updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,                                                                                                                                                  
           CONSTRAINT uq_user_topic_slug UNIQUE (user_id, slug)                                                                                                                                               
       );                                                                                                                                                                                                     
                                                                                                                                                                                                              
       -- Bảng Notes (Ghi chú thường)                                                                                                                                                                      
       CREATE TABLE IF NOT EXISTS notes (                                                                                                                                                                     
           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                                                                                                                                                    
           user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,                                                                                                                                      
           topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,                                                                                                                                            
           title VARCHAR(255) NOT NULL,                                                                                                                                                                       
           content TEXT NOT NULL,                                                                                                                                                                             
           is_pinned BOOLEAN DEFAULT FALSE,                                                                                                                                                                   
           version INT DEFAULT 1,                                                                                                                                                                             
           created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,                                                                                                                                                  
           updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP                                                                                                                                                   
       );                                                                                                                                                                                                     
                                                                                                                                                                                                              
       -- Bảng Private Notes (Ghi chú riêng tư - Mã hóa AES-256-GCM)                                                                                                                                       
       CREATE TABLE IF NOT EXISTS private_notes (                                                                                                                                                             
           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                                                                                                                                                    
           user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,                                                                                                                                      
           title VARCHAR(255) NOT NULL,                                                                                                                                                                       
           encrypted_content TEXT NOT NULL,                                                                                                                                                                   
           iv VARCHAR(64) NOT NULL,                                                                                                                                                                           
           auth_tag VARCHAR(64) NOT NULL,                                                                                                                                                                     
           is_pinned BOOLEAN DEFAULT FALSE,                                                                                                                                                                   
           version INT DEFAULT 1,                                                                                                                                                                             
           created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,                                                                                                                                                  
           updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP                                                                                                                                                   
       );                                                                                                                                                                                                     
                                                                                                                                                                                                              
       -- Tối ưu hóa hiệu năng (Indexes)                                                                                                                                                                      
       CREATE INDEX IF NOT EXISTS idx_notes_user_topic ON notes(user_id, topic_id);                                                                                                                           
       CREATE INDEX IF NOT EXISTS idx_notes_user_created ON notes(user_id, created_at DESC);                                                                                                                  
       CREATE INDEX IF NOT EXISTS idx_private_notes_user ON private_notes(user_id, created_at DESC);                                                                                                          
     `;

  try {
    await dbPool.query(ddlQuery);
    console.log(
      "[DATABASE MIGRATION]: Đã kiểm tra & khởi tạo toàn bộ Bảng & Indexes thành công!",
    );
  } catch (error) {
    console.error("[DATABASE MIGRATION ERROR]: Khởi tạo Bảng thất bại:", error);
    throw error;
  }
};
