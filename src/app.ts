import express, {Application, Request, Response} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { globalErrorHandler } from './middlewares/error.middleware';
import { ApiResponse } from './utils/response.util';
import { uptime } from 'node:process';
import { timeStamp } from 'node:console';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Body Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck Endpoint
app.get('/health', (req: Request,  res: Response) => {
    return ApiResponse.success(res, 200, 'Server Note-Vault Enterprise đang chạy ngon lành!' ,{
        environment: config.NODE_ENV,
        uptime: `${Math.floor(process.uptime())} seconds`,
        timeStamp: new Date().toISOString(),
    });
});

app.use(globalErrorHandler);

export default app;

