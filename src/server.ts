import * as express from "express";
import { Data, endpointDecoder } from "./data";
import { DecodeError } from "./decoder";

const port = +process.env.PORT || 3000;

type Req = express.Request;
type Res = express.Response;
const app = express();
const data = new Data();

app.use(express.json());

app.post("/endpoints", async (req: Req, res: Res) => {
  let endpoint;
  try {
    endpoint = endpointDecoder.run(req.body);
  } catch (e) {
    const status = e instanceof DecodeError ? 400 : 500;
    return res.status(status).send({
      message: e.message
    });
  }
  const key = await data.addEndPoint(endpoint);
  res.send({
    key
  });
});
app.get("/endpoints/:key/results", async (req: Req, res: Res) => {
  const key = req.params.key;
  const from = +req.query.from;
  const results = await data.getResults(key, from);
  if (!results) {
    return res.status(404).send();
  }
  res.send({
    items: results
  });
});
app.all("/:key", async (req: Req, res: Res) => {
  const key = req.params.key;
  const endpoint = await data.getEndpoint(key);
  if (endpoint && endpoint.method === req.method) {
    const request = {
      method: req.method as any,
      headers: req.headers as any,
      body: req.body
    };
    data.addRequest(key, request);
    for (const key in endpoint.response.headers) {
      res.setHeader(key, endpoint.response.headers[key]);
    }
    return res.status(endpoint.response.status).send(endpoint.response.body);
  }
  res.status(404).send();
});

export async function run(): Promise<{
  close: () => void;
  gc: (now: number) => void;
}> {
  let interval: any;
  let server: any;
  try {
    interval = setInterval(() => {
      data.gc(Date.now());
    }, 1 * 60 * 1000);
    server = app.listen(port, () =>
      console.log(`Server listening on port ${port}!`)
    );
  } catch (e) {
    close();
    throw e;
  }
  function close() {
    clearInterval(interval);
    if (server) {
      server.close();
    }
  }
  return {
    close,
    gc(now) {
      data.gc(now);
    }
  };
}
