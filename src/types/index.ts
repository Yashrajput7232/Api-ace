export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface ApiRequest {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers: KeyValue[];
  params: KeyValue[];
  body: string; // stringified JSON
  collectionId: string;
}

export interface Collection {
  id: string; // This is the access code
  name: string;
  requests: ApiRequest[];
}

export interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  time: number;
  size: number; // in bytes
}

export interface RequestTab extends ApiRequest {
  response?: ApiResponse;
  loading: boolean;
  isDirty: boolean;
}
