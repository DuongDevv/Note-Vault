import {Response} from 'express';

export class ApiResponse {
    // Trả về Status 200, 201, 204 (Nếu thành công)
    static success(res: Response, statusCode: number, message: string, data?: any, meta?: any){
        return res.status(statusCode).json({
            success: true,
            statusCode,
            message,
            data,
            meta,
        });
    }

    // Trả về Status: 400, 401, 403, 404, 409, 429, 500 (Nếu Response lỗi)
    static error(res: Response, statusCode: number, message: string, error: string, details?: any) {
        return res.status(statusCode).json({
            success: false,
            statusCode,
            message,
            error,
            details,
            timeStamp: new Date().toISOString(),
        });
    }
}