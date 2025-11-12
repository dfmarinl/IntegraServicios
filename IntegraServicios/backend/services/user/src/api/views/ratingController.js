const Rating = require("../../../../../models/Rating");

exports.createRating = async (req, res) => {
  try {
    const rating = await Rating.create(req.body);
    res.status(201).json(rating);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getRatings = async (req, res) => {
  const ratings = await Rating.findAll();
  res.json(ratings);
};

exports.getRatingById = async (req, res) => {
  const rating = await Rating.findByPk(req.params.id);
  if (!rating) return res.status(404).json({ message: "Calificación no encontrada" });
  res.json(rating);
};

exports.updateRating = async (req, res) => {
  const rating = await Rating.findByPk(req.params.id);
  if (!rating) return res.status(404).json({ message: "Calificación no encontrada" });
  await rating.update(req.body);
  res.json(rating);
};

exports.deleteRating = async (req, res) => {
  const rating = await Rating.findByPk(req.params.id);
  if (!rating) return res.status(404).json({ message: "Calificación no encontrada" });
  await rating.destroy();
  res.json({ message: "Calificación eliminada" });
};
