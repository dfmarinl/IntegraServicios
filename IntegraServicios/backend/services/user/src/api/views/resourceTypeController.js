const ResourceType = require("../../../../../models/ResourceType");

exports.createResourceType = async (req, res) => {
  try {
    const type = await ResourceType.create(req.body);
    res.status(201).json(type);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getResourceTypes = async (req, res) => {
  const types = await ResourceType.findAll();
  res.json(types);
};

exports.updateResourceType = async (req, res) => {
  const type = await ResourceType.findByPk(req.params.id);
  if (!type) return res.status(404).json({ message: "Tipo no encontrado" });
  await type.update(req.body);
  res.json(type);
};

exports.deleteResourceType = async (req, res) => {
  const type = await ResourceType.findByPk(req.params.id);
  if (!type) return res.status(404).json({ message: "Tipo no encontrado" });
  await type.destroy();
  res.json({ message: "Tipo de recurso eliminado" });
};
