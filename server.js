import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";

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

app.listen(port, () => console.log(`server started on PORT: ${port}`));
