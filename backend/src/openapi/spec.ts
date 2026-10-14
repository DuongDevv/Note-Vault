import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  setPrivatePinSchema,
  verifyPinSchema,
  userProfileResponseSchema,
  authResponseDataSchema,
  verifyPinResponseDataSchema,
  lockVaultResponseDataSchema,
} from "../schemas/auth.schema";
import { createTopicSchema, updateTopicSchema, topicResponseSchema } from "../schemas/topic.schema";
import { createNoteSchema, updateNoteSchema, noteResponseSchema } from "../schemas/note.schema";
import { createSuccessEnvelopeSchema, errorEnvelopeSchema } from "../schemas/response.schema";
function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const toSchema = z.toJSONSchema as (s: z.ZodType) => Record<string, unknown>;
  const raw = toSchema(schema);
  const { $schema: _schema, ...rest } = raw;
  return rest;
}

export function buildOpenApiSpec() {
  const errorSchema = jsonSchema(errorEnvelopeSchema);
  const unauthorizedResponse = {
    description: "Chưa xác thực hoặc token không hợp lệ",
    content: { "application/json": { schema: errorSchema } },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "NoteVault API",
      version: "1.0.0",
      description: "REST API documentation and contract for NoteVault personal knowledge base.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "API Gateway v1",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "User JWT Bearer token obtained via /auth/login or /auth/register",
        },
        vaultTokenAuth: {
          type: "apiKey",
          in: "header",
          name: "x-vault-token",
          description: "Temporary Vault session token obtained via /profile/verify-pin",
        },
      },
      schemas: {
        ErrorResponse: errorSchema,
        RegisterInput: jsonSchema(registerSchema),
        LoginInput: jsonSchema(loginSchema),
        UserProfile: jsonSchema(userProfileResponseSchema),
        AuthResponseData: jsonSchema(authResponseDataSchema),
        SetPrivatePinInput: jsonSchema(setPrivatePinSchema),
        VerifyPinInput: jsonSchema(verifyPinSchema),
        VerifyPinResponseData: jsonSchema(verifyPinResponseDataSchema),
        LockVaultResponseData: jsonSchema(lockVaultResponseDataSchema),
        CreateTopicInput: jsonSchema(createTopicSchema),
        UpdateTopicInput: jsonSchema(updateTopicSchema),
        TopicResponse: jsonSchema(topicResponseSchema),
        CreateNoteInput: jsonSchema(createNoteSchema),
        UpdateNoteInput: jsonSchema(updateNoteSchema),
        NoteResponse: jsonSchema(noteResponseSchema),
      },
    },
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Đăng ký tài khoản người dùng mới",
          operationId: "register",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: jsonSchema(registerSchema),
              },
            },
          },
          responses: {
            "201": {
              description: "Đăng ký tài khoản thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(authResponseDataSchema)),
                },
              },
            },
            "400": {
              description: "Dữ liệu đăng ký không hợp lệ",
              content: { "application/json": { schema: errorSchema } },
            },
            "409": {
              description: "Username hoặc Email đã tồn tại",
              content: { "application/json": { schema: errorSchema } },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Đăng nhập và nhận JWT access token",
          operationId: "login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: jsonSchema(loginSchema),
              },
            },
          },
          responses: {
            "200": {
              description: "Đăng nhập thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(authResponseDataSchema)),
                },
              },
            },
            "400": {
              description: "Thiếu username hoặc mật khẩu",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": {
              description: "Sai thông tin tài khoản hoặc mật khẩu",
              content: { "application/json": { schema: errorSchema } },
            },
          },
        },
      },
      "/profile": {
        get: {
          tags: ["Profile"],
          summary: "Lấy thông tin người dùng hiện tại",
          operationId: "getProfile",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Lấy thông tin profile thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(userProfileResponseSchema)),
                },
              },
            },
            "401": {
              description: "Chưa đăng nhập hoặc token không hợp lệ",
              content: { "application/json": { schema: errorSchema } },
            },
          },
        },
      },
      "/profile/private-pin": {
        post: {
          tags: ["Profile"],
          summary: "Thiết lập hoặc đổi Master PIN bảo vệ",
          operationId: "setPrivatePin",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: jsonSchema(setPrivatePinSchema),
              },
            },
          },
          responses: {
            "200": {
              description: "Thiết lập mã PIN thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(
                    createSuccessEnvelopeSchema(
                      z.object({
                        hasPrivatePin: z.literal(true),
                      }),
                    ),
                  ),
                },
              },
            },
            "400": {
              description: "Mã PIN không đúng định dạng 6 chữ số",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": {
              description: "Chưa xác thực danh tính",
              content: { "application/json": { schema: errorSchema } },
            },
          },
        },
      },
      "/profile/verify-pin": {
        post: {
          tags: ["Profile"],
          summary: "Xác thực Master PIN để mở phiên Két bảo mật (Vault Session)",
          operationId: "verifyPin",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: jsonSchema(verifyPinSchema),
              },
            },
          },
          responses: {
            "200": {
              description: "Xác thực PIN thành công, trả về vaultToken",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(verifyPinResponseDataSchema)),
                },
              },
            },
            "400": {
              description: "Chưa thiết lập PIN hoặc định dạng sai",
              content: { "application/json": { schema: errorSchema } },
            },
            "403": {
              description: "Mã PIN không chính xác",
              content: { "application/json": { schema: errorSchema } },
            },
          },
        },
      },
      "/profile/lock-vault": {
        post: {
          tags: ["Profile"],
          summary: "Khóa Két bảo mật và thu hồi Vault Session",
          operationId: "lockVault",
          security: [{ bearerAuth: [] }, { vaultTokenAuth: [] }],
          responses: {
            "200": {
              description: "Đã khóa Vault thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(lockVaultResponseDataSchema)),
                },
              },
            },
            "401": unauthorizedResponse,
          },
        },
      },
      "/topics": {
        get: {
          tags: ["Topics"],
          summary: "Lấy danh sách các chủ đề (Topics) của người dùng",
          operationId: "getTopics",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Danh sách topics",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(z.array(topicResponseSchema))),
                },
              },
            },
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Topics"],
          summary: "Tạo chủ đề mới",
          operationId: "createTopic",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: jsonSchema(createTopicSchema),
              },
            },
          },
          responses: {
            "201": {
              description: "Tạo chủ đề thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(topicResponseSchema)),
                },
              },
            },
            "400": {
              description: "Tên chủ đề không hợp lệ",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": unauthorizedResponse,
          },
        },
      },
      "/topics/{id}": {
        patch: {
          tags: ["Topics"],
          summary: "Cập nhật tên chủ đề",
          operationId: "updateTopic",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "ID chủ đề",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: jsonSchema(updateTopicSchema),
              },
            },
          },
          responses: {
            "200": {
              description: "Cập nhật chủ đề thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(topicResponseSchema)),
                },
              },
            },
            "404": {
              description: "Không tìm thấy chủ đề",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": unauthorizedResponse,
          },
        },
        delete: {
          tags: ["Topics"],
          summary: "Xóa chủ đề (các ghi chú chuyển về trạng thái không chủ đề)",
          operationId: "deleteTopic",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "ID chủ đề",
            },
          ],
          responses: {
            "200": {
              description: "Xóa chủ đề thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(
                    createSuccessEnvelopeSchema(
                      z.object({
                        id: z.string(),
                      }),
                    ),
                  ),
                },
              },
            },
            "404": {
              description: "Không tìm thấy chủ đề",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": unauthorizedResponse,
          },
        },
      },
      "/notes": {
        get: {
          tags: ["Notes"],
          summary: "Lấy danh sách các ghi chú",
          operationId: "getNotes",
          security: [{ bearerAuth: [] }, { vaultTokenAuth: [] }],
          parameters: [
            {
              name: "topicId",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Lọc theo ID chủ đề",
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Từ khóa tìm kiếm tiêu đề/nội dung",
            },
          ],
          responses: {
            "200": {
              description: "Danh sách ghi chú",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(z.array(noteResponseSchema))),
                },
              },
            },
            "401": unauthorizedResponse,
          },
        },
        post: {
          tags: ["Notes"],
          summary: "Tạo ghi chú mới",
          operationId: "createNote",
          security: [{ bearerAuth: [] }, { vaultTokenAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: jsonSchema(createNoteSchema),
              },
            },
          },
          responses: {
            "201": {
              description: "Tạo ghi chú thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(noteResponseSchema)),
                },
              },
            },
            "400": {
              description: "Dữ liệu ghi chú không hợp lệ",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": unauthorizedResponse,
          },
        },
      },
      "/notes/{id}": {
        get: {
          tags: ["Notes"],
          summary: "Lấy chi tiết một ghi chú theo ID",
          operationId: "getNoteById",
          security: [{ bearerAuth: [] }, { vaultTokenAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "ID ghi chú",
            },
          ],
          responses: {
            "200": {
              description: "Chi tiết ghi chú",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(noteResponseSchema)),
                },
              },
            },
            "404": {
              description: "Ghi chú không tồn tại",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": unauthorizedResponse,
          },
        },
        put: {
          tags: ["Notes"],
          summary: "Cập nhật nội dung, tiêu đề hoặc trạng thái ghi chú",
          operationId: "updateNote",
          security: [{ bearerAuth: [] }, { vaultTokenAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "ID ghi chú",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: jsonSchema(updateNoteSchema),
              },
            },
          },
          responses: {
            "200": {
              description: "Cập nhật ghi chú thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(noteResponseSchema)),
                },
              },
            },
            "404": {
              description: "Ghi chú không tồn tại",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": unauthorizedResponse,
          },
        },
        delete: {
          tags: ["Notes"],
          summary: "Xóa vĩnh viễn ghi chú",
          operationId: "deleteNote",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "ID ghi chú",
            },
          ],
          responses: {
            "200": {
              description: "Xóa ghi chú thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(
                    createSuccessEnvelopeSchema(
                      z.object({
                        id: z.string(),
                      }),
                    ),
                  ),
                },
              },
            },
            "404": {
              description: "Ghi chú không tồn tại",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": unauthorizedResponse,
          },
        },
      },
      "/notes/{id}/toggle-pin": {
        post: {
          tags: ["Notes"],
          summary: "Ghim hoặc bỏ ghim ghi chú trên thanh bên",
          operationId: "toggleNotePin",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "ID ghi chú",
            },
          ],
          responses: {
            "200": {
              description: "Chuyển đổi trạng thái ghim thành công",
              content: {
                "application/json": {
                  schema: jsonSchema(createSuccessEnvelopeSchema(noteResponseSchema)),
                },
              },
            },
            "404": {
              description: "Ghi chú không tồn tại",
              content: { "application/json": { schema: errorSchema } },
            },
            "401": unauthorizedResponse,
          },
        },
      },
    },
  };
}
