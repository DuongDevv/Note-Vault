import createClient from "openapi-fetch";
import type { paths, components } from "@/types/api.generated";
import { getAuthHeaders } from "./tokens";

export type ApiSchemas = components["schemas"];
export type UserProfileDto = ApiSchemas["UserProfile"];
export type AuthResponseDataDto = ApiSchemas["AuthResponseData"];
export type TopicResponseDto = ApiSchemas["TopicResponse"];
export type NoteResponseDto = ApiSchemas["NoteResponse"];
export type CreateNoteInputDto = ApiSchemas["CreateNoteInput"];
export type UpdateNoteInputDto = ApiSchemas["UpdateNoteInput"];
export type CreateTopicInputDto = ApiSchemas["CreateTopicInput"];
export type UpdateTopicInputDto = ApiSchemas["UpdateTopicInput"];

export const api = createClient<paths>({
  baseUrl: "/api/v1",
});

// Middleware to inject Authorization and x-vault-token headers automatically
api.use({
  onRequest({ request }) {
    const headers = getAuthHeaders();
    for (const [key, value] of Object.entries(headers)) {
      request.headers.set(key, value);
    }
    return request;
  },
});
