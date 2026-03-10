export default async function handler(req, res) {

  const { path = [] } = req.query;

  const url = `https://internhub-api.onrender.com/api/${path.join("/")}`;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.cookie || ""
    },
    body: req.method !== "GET" && req.method !== "HEAD"
      ? JSON.stringify(req.body)
      : undefined
  });

  const data = await response.text();

  res.status(response.status).send(data);
}