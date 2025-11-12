const Return = require("../../../../../models/Return");
const Loan = require("../../../../../models/Loan");
const Reservation = require("../../../../../models/Reservation");

exports.createReturn = async (req, res) => {
  try {
    const { loanId, returnTime, employeeId } = req.body;
    const loan = await Loan.findByPk(loanId);

    if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });

    const devolucion = await Return.create({
      loanId,
      returnTime,
      employeeId,
    });

    const reservation = await Reservation.findByPk(loan.reservationId);
    if (reservation) await reservation.update({ status: "finalizada" });

    res.status(201).json(devolucion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getReturns = async (req, res) => {
  const returns = await Return.findAll();
  res.json(returns);
};

exports.getReturnById = async (req, res) => {
  const devolucion = await Return.findByPk(req.params.id);
  if (!devolucion)
    return res.status(404).json({ message: "Devolución no encontrada" });
  res.json(devolucion);
};

exports.updateReturn = async (req, res) => {
  const devolucion = await Return.findByPk(req.params.id);
  if (!devolucion)
    return res.status(404).json({ message: "Devolución no encontrada" });
  await devolucion.update(req.body);
  res.json(devolucion);
};

exports.deleteReturn = async (req, res) => {
  const devolucion = await Return.findByPk(req.params.id);
  if (!devolucion)
    return res.status(404).json({ message: "Devolución no encontrada" });
  await devolucion.destroy();
  res.json({ message: "Devolución eliminada" });
};
