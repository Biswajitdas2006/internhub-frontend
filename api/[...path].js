export default async function handler(req, res) {
  const { path = [] } = req.query;

  const targetUrl = `https://internhub-api.onrender.com/api/${path.join("/")}`;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      ...req.headers,
      host: undefined
    },
    body: req.method !== "GET" && req.method !== "HEAD"
      ? JSON.stringify(req.body)
      : undefined,
    redirect: "manual"
  });

  // copy status
  res.status(response.status);

  // copy headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const data = await response.arrayBuffer();

  res.send(Buffer.from(data));
}