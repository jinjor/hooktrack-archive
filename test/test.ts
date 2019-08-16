import { run } from "../src/server";
import fetch from "node-fetch";
import * as assert from "assert";

const port = 3000;
const origin = `http://localhost:${port}`;

async function send(method: string, path: string, data: any): Promise<any> {
  const url = origin + path;
  const options: any = {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  };
  if (data) {
    options.body = JSON.stringify(data);
  }
  return fetch(url, options);
}
async function get(path: string): Promise<any> {
  return send("GET", path, null);
}
async function post(path: string, data: any): Promise<any> {
  return send("POST", path, data);
}

describe("Hooktrack", function() {
  this.timeout(30 * 1000);
  let server: any;
  before(async () => {
    server = await run(port);
  });
  it("run", async () => {
    let res;
    res = await post(`/endpoints`, {
      method: "POST",
      response: {
        status: 200,
        headers: {
          foo: "bar"
        },
        body: JSON.stringify({
          greeting: "Hello!"
        })
      }
    });
    const { key } = await res.json();
    res = await post(`/${key}`, {});
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(res.headers.get("foo"), "bar");
    assert.equal(data.greeting, "Hello!");
    res = await get(`/endpoints/${key}/results`);
    let results = await res.json();
    assert.equal(results.items.length, 1);
    res = await get(`/endpoints/${key}/results?from=${Date.now()}`);
    results = await res.json();
    assert.equal(results.items.length, 0);
    res = await get(`/endpoints/${key}/results?from=${Date.now() - 10 * 1000}`);
    results = await res.json();
    assert.equal(results.items.length, 1);
    server.gc(Date.now() + 2 * 24 * 60 * 60 * 1000);
    res = await get(`/endpoints/${key}/results`);
    assert.equal(res.status, 404);
  });
  it("errors", async () => {
    let res;
    res = await get(`/`);
    assert.equal(res.status, 404);
    res = await get(`/foo`);
    assert.equal(res.status, 404);
    res = await post(`/foo`, {});
    assert.equal(res.status, 404);
    res = await get(`/endpoints/foo`);
    assert.equal(res.status, 404);
    res = await get(`/endpoints/foo/results`);
    assert.equal(res.status, 404);
    for (const method of [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTION"
    ]) {
      res = await post(`/endpoints`, {
        method
      });
      assert.equal(res.status, 200);
    }
    res = await post(`/endpoints`, {
      method: ""
    });
    assert.equal(res.status, 400);
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        status: 200,
        body: ""
      }
    });
    assert.equal(res.status, 200);
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        body: "{}"
      }
    });
    assert.equal(res.status, 200);
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        status: 200
      }
    });
    assert.equal(res.status, 200);
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        body: {}
      }
    });
    assert.equal(res.status, 400);
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        status: ""
      }
    });
    assert.equal(res.status, 400);
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        headers: []
      }
    });
    assert.equal(res.status, 400);
  });

  after(() => {
    if (server) {
      server.close();
    }
  });
});
