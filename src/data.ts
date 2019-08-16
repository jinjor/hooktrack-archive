import * as uuid from "uuid";
import {
  Decoder,
  object,
  optional,
  number,
  string,
  keywords,
  dict,
  any
} from "./decoder";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTION";
type Headers = { [key: string]: string };
interface Request {
  method: Method;
  headers: Headers;
  body: string;
}
interface Response {
  status: number;
  headers: Headers;
  body: string;
}
interface Endpoint {
  method: Method;
  response?: Response;
}
interface EndpointWithStatus {
  endpoint: Endpoint;
  results: Result[];
  expiredAt: number;
}
interface Result {
  request: Request;
  requestedAt: number;
}

const methodDecoder: Decoder<Method> = keywords([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTION"
]);
const responseDecoder: Decoder<Response> = object({
  status: optional(number, 200),
  headers: optional(dict(string), {}),
  body: optional(string)
});
export const endpointDecoder: Decoder<Endpoint> = object({
  method: methodDecoder,
  response: optional(responseDecoder)
});

export class Data {
  private endpoints: Map<string, EndpointWithStatus> = new Map();
  async addEndPoint(endpoint: Endpoint): Promise<string> {
    const key: string = uuid.v4();
    this.endpoints.set(key, {
      endpoint,
      results: [],
      expiredAt: Date.now() + 24 * 60 * 60 * 1000
    });
    return key;
  }
  async addRequest(key: string, request: Request): Promise<Result> {
    if (this.endpoints.has(key)) {
      const result = {
        request,
        requestedAt: Date.now()
      };
      this.endpoints.get(key).results.push(result);
      return result;
    }
    return null;
  }
  async getEndpoint(key: string): Promise<Endpoint> {
    if (this.endpoints.has(key)) {
      return this.endpoints.get(key).endpoint;
    }
    return null;
  }
  async getResults(key: string, from: number): Promise<Result[]> {
    if (this.endpoints.has(key)) {
      return this.endpoints.get(key).results.filter(result => {
        return from ? result.requestedAt > from : true;
      });
    }
    return null;
  }
  gc(now: number): void {
    for (const key of this.endpoints.keys()) {
      const { expiredAt } = this.endpoints.get(key);
      if (expiredAt < now) {
        this.endpoints.delete(key);
      }
    }
  }
}
