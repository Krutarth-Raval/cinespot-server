import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";

const app = express();
const port = process.env.PORT || 4000;



app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = ['http://localhost:5173', 'https://cinemaspot.netlify.app'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

connectDB();

//API endpoints
app.get("/", (req, res) => res.send("API WORKING"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/collection", collectionRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.get("/api/tmdb/proxy", async (req, res) => {
  try {
    const { endpoint } = req.query;
    const tmdbUrl = `https://api.themoviedb.org/3${endpoint}&api_key=${process.env.TMDB_API_KEY}`;

    const tmdbRes = await fetch(tmdbUrl);
    const data = await tmdbRes.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from TMDB" });
  }
});

app.listen(port, () => console.log(`server started on PORT: ${port}`));
