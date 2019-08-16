# Hooktrack

[![Build Status](https://travis-ci.org/jinjor/hooktrack.svg)](https://travis-ci.org/jinjor/hooktrack)

Define REST API and track the requests.

## Example

Add an endpoint.

```shell
$ curl -s -X POST -H "Content-Type: application/json" -d '{ "method":"GET", "response":{"body":"Hello!"} }' http://hooktrack.herokuapp.com/endpoints
{"key":"ca5aea78-9c5d-4032-8829-ad7e90ad91e9"}
```

Call it.

```shell
$ curl http://hooktrack.herokuapp.com/ca5aea78-9c5d-4032-8829-ad7e90ad91e9
Hello!
```

See the result.

```shell
$ curl http://hooktrack.herokuapp.com/endpoints/ca5aea78-9c5d-4032-8829-ad7e90ad91e9/results
{"items":[{"request":{"method":"GET","headers":{"host":"hooktrack.herokuapp.com","connection":"close","user-agent":"curl/7.54.0","accept":"*/*","x-request-id":"26b654c2-18be-4c53-8018-d9d707a8e5dc","x-forwarded-for":"153.156.78.134","x-forwarded-proto":"http","x-forwarded-port":"80","via":"1.1 vegur","connect-time":"0","x-request-start":"1565949486167","total-route-time":"0"},"body":{}},"requestedAt":1565949486167}]}
```
