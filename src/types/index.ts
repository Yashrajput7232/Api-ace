import { ObjectId } from "mongodb";

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface Auth {
  type: 'no-auth' | 'api-key' | 'bearer' | 'basic';
  apiKey?: {
    key: string;
    value: string;
    in: 'header' | 'query';
  };
  bearer?: {
    token: string;
  };
  basic?: {
    username: string;
    password: string;
  };
}


export interface ApiRequest {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  auth: Auth;
  headers: KeyValue[];
  params: KeyValue[];
  body: string; // stringified JSON
  collectionId: string;
}

export interface Collection {
  _id?: ObjectId;
  id: string;
  name: string;
  requests: ApiRequest[];
  userId: ObjectId;
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

export interface User {
  _id: ObjectId;
  id: string;
  email: string;
  password: string;
}
