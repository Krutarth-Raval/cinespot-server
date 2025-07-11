import Collection from "../models/collectionModel.js";

// ➕ Add a movie to the collection
export const addToCollection = async (req, res) => {
  const { movieId, title, poster } = req.body;
  const userId = req.userId;

  if (!movieId || !title || !poster) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    let collection = await Collection.findOne({ userId });

    if (!collection) {
      collection = new Collection({ userId, movies: [] });
    }

    const exists = collection.movies.some((m) => m.movieId === movieId);
    if (exists) {
      return res.status(409).json({ success: false, message: "Movie already added" });
    }

    collection.movies.push({ movieId, title, poster });
    await collection.save();

    res.json({ success: true, message: "Movie added to collection" });
  } catch (error) {
    console.error("Add to collection error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 📥 Get all movies from user's collection
export const getUserCollection = async (req, res) => {
  try {
    const collection = await Collection.findOne({ userId: req.userId });

    if (!collection) {
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: collection.movies });
  } catch (error) {
    console.error("Get collection error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ❌ Remove a movie from the collection
export const removeFromCollection = async (req, res) => {
  try {
    const { userId } = req;
    const { movieId } = req.params;

    const collection = await Collection.findOne({ userId });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    const index = collection.movies.findIndex((m) => m.movieId === movieId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Movie not found in collection" });
    }

    collection.movies.splice(index, 1);
    await collection.save();

    res.json({ success: true, message: "Movie removed from collection" });
  } catch (error) {
    console.error("Remove collection error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
