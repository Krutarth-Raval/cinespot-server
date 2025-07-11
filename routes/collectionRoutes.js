import express from "express";
import userAuth from "../middleware/userAuth.js";
import { addToCollection, getUserCollection, removeFromCollection } from "../Controllers/collectionController.js";


const router = express.Router();

router.post("/add", userAuth, addToCollection);
router.get("/user", userAuth, getUserCollection);
router.delete("/remove/:movieId", userAuth, removeFromCollection);

export default router;
