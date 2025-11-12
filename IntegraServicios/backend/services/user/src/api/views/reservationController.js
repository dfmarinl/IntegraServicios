const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const { Op } = require("sequelize");

exports.createReservation = async (req, res) => {
  try {
    const { resourceId, startDateTime, endDateTime, userId } = req.body;

    // Validar conflictos de reserva
    const conflicts = await Reservation.findOne({
      where: {
        resourceId,
        status: { [Op.ne]: "cancelada" },
        [Op.or]: [
          {
            startDateTime: { [Op.between]: [startDateTime, endDateTime] },
          },
          {
            endDateTime: { [Op.between]: [startDateTime, endDateTime] },
          },
        ],
      },
    });

    if (conflicts)
      return res.status(400).json({ message: "Conflicto de reserva detectado" });

    const reservation = await Reservation.create({
      resourceId,
      startDateTime,
      endDateTime,
      userId,
      status: "pendiente",
    });

    res.status(201).json(reservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getReservations = async (req, res) => {
  const reservations = await Reservation.findAll();
  res.json(reservations);
};

exports.getReservationById = async (req, res) => {
  const reservation = await Reservation.findByPk(req.params.id);
  if (!reservation)
    return res.status(404).json({ message: "Reserva no encontrada" });
  res.json(reservation);
};

exports.updateReservation = async (req, res) => {
  const reservation = await Reservation.findByPk(req.params.id);
  if (!reservation)
    return res.status(404).json({ message: "Reserva no encontrada" });
  await reservation.update(req.body);
  res.json(reservation);
};

exports.cancelReservation = async (req, res) => {
  const reservation = await Reservation.findByPk(req.params.id);
  if (!reservation)
    return res.status(404).json({ message: "Reserva no encontrada" });

  if (reservation.status !== "pendiente")
    return res.status(400).json({ message: "Solo se pueden cancelar reservas pendientes" });

  await reservation.update({ status: "cancelada" });
  res.json({ message: "Reserva cancelada correctamente" });
};

exports.deleteReservation = async (req, res) => {
  const reservation = await Reservation.findByPk(req.params.id);
  if (!reservation)
    return res.status(404).json({ message: "Reserva no encontrada" });
  await reservation.destroy();
  res.json({ message: "Reserva eliminada" });
};
