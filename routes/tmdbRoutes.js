import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

router.get("/proxy", async (req, res) => {
  const { endpoint } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: "Missing TMDb endpoint" });
  }

  try {
    const joiner = endpoint.includes("?") ? "&" : "?";
    const url = `${BASE_URL}${endpoint}${joiner}api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: "TMDB fetch failed" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from TMDb" });
  }
});

export default router;
