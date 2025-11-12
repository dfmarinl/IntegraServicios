const Resource = require("../../../../../models/Resource");

exports.createResource = async (req, res) => {
  try {
    const resource = await Resource.create(req.body);
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getResources = async (req, res) => {
  const resources = await Resource.findAll();
  res.json(resources);
};

exports.getResourceById = async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ message: "Recurso no encontrado" });
  res.json(resource);
};

exports.updateResource = async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ message: "Recurso no encontrado" });
  await resource.update(req.body);
  res.json(resource);
};

exports.deleteResource = async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ message: "Recurso no encontrado" });
  await resource.destroy();
  res.json({ message: "Recurso eliminado" });
};
