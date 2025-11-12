const Failure = require("../../../../../models/Failure");

exports.createFailure = async (req, res) => {
  try {
    const failure = await Failure.create(req.body);
    res.status(201).json(failure);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getFailures = async (req, res) => {
  const failures = await Failure.findAll();
  res.json(failures);
};

exports.getFailureById = async (req, res) => {
  const failure = await Failure.findByPk(req.params.id);
  if (!failure) return res.status(404).json({ message: "Fallo no encontrado" });
  res.json(failure);
};

exports.updateFailure = async (req, res) => {
  const failure = await Failure.findByPk(req.params.id);
  if (!failure) return res.status(404).json({ message: "Fallo no encontrado" });
  await failure.update(req.body);
  res.json(failure);
};

exports.deleteFailure = async (req, res) => {
  const failure = await Failure.findByPk(req.params.id);
  if (!failure) return res.status(404).json({ message: "Fallo no encontrado" });
  await failure.destroy();
  res.json({ message: "Fallo eliminado" });
};
