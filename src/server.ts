import app from './app';
import { config } from './config/env';
import { dbPool } from './config/database';
import { connectRedis } from './config/redis';
import { initDatabase } from './config/init-db';

const PORT = config.PORT;

const startServer = async () => {
    try{
        // Kết nối Redis
        await connectRedis();

        // Tự động khởi tạo Schema DB PostgreSQL
        await initDatabase();

        // Khởi động HTTP Server
        app.listen(PORT, () => {
            console.log(`================================================`);                                                                                                                                     
            console.log(`Server Note-Vault Enterprise running on Port: ${PORT}`);                                                                                                                           
            console.log(`Healthcheck: http://localhost:${PORT}/health`);                                                                                                                                      
            console.log(`================================================`);  
        });
    }catch (error){
        console.error('Thất bại khi khởi động hệ thống:', error);                                                                                                                                           
        process.exit(1);
    }
};

startServer();