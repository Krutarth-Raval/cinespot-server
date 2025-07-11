import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  movies: [
    {
      movieId: String,
      title: String,
      poster: String,
    }
  ]
});

const Collection = mongoose.model("Collection", collectionSchema); // ✅ Named const

export default Collection;
