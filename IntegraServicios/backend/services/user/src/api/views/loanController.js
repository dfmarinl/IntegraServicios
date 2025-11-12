const Loan = require("../../../../../models/Loan");
const Reservation = require("../../../../../models/Reservation");

exports.createLoan = async (req, res) => {
  try {
    const { reservationId, deliveryTime, employeeId } = req.body;
    const reservation = await Reservation.findByPk(reservationId);

    if (!reservation || reservation.status !== "pendiente") {
      return res.status(400).json({ message: "Reserva inválida o no vigente" });
    }

    const loan = await Loan.create({
      reservationId,
      deliveryTime,
      employeeId,
    });

    await reservation.update({ status: "activa" });

    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getLoans = async (req, res) => {
  const loans = await Loan.findAll();
  res.json(loans);
};

exports.getLoanById = async (req, res) => {
  const loan = await Loan.findByPk(req.params.id);
  if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });
  res.json(loan);
};

exports.updateLoan = async (req, res) => {
  const loan = await Loan.findByPk(req.params.id);
  if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });
  await loan.update(req.body);
  res.json(loan);
};

exports.deleteLoan = async (req, res) => {
  const loan = await Loan.findByPk(req.params.id);
  if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });
  await loan.destroy();
  res.json({ message: "Préstamo eliminado" });
};
