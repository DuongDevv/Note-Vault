import createClient from "openapi-fetch";
import type { paths, components } from "@/types/api.generated";
import { getAuthToken, getVaultToken, clearAuthToken } from "./tokens";

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
    const token = getAuthToken();
    if (token && !request.headers.has("Authorization")) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }

    const vaultToken = getVaultToken();
    if (vaultToken && !request.headers.has("x-vault-token")) {
      request.headers.set("x-vault-token", vaultToken);
    }

    return request;
  },
  onResponse({ response }) {
    if (response.status === 401) {
      clearAuthToken();
    }
  },
});
