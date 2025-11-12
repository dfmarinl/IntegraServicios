const Availability = require("../../../../../models/Availability");

exports.createAvailability = async (req, res) => {
  try {
    const availability = await Availability.create(req.body);
    res.status(201).json(availability);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAvailabilities = async (req, res) => {
  const availabilities = await Availability.findAll();
  res.json(availabilities);
};

exports.updateAvailability = async (req, res) => {
  const availability = await Availability.findByPk(req.params.id);
  if (!availability) return res.status(404).json({ message: "Disponibilidad no encontrada" });
  await availability.update(req.body);
  res.json(availability);
};

exports.deleteAvailability = async (req, res) => {
  const availability = await Availability.findByPk(req.params.id);
  if (!availability) return res.status(404).json({ message: "Disponibilidad no encontrada" });
  await availability.destroy();
  res.json({ message: "Disponibilidad eliminada" });
};
