'use strict';

const Car = require('../_models/Car');

/** GET /api/cars?supplierId= */
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.supplierId) filter.supplierId = req.query.supplierId;

    const cars = await Car.find(filter).populate('supplierId', 'name').sort({ name: 1 });
    res.json({ success: true, data: cars });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** POST /api/cars */
exports.create = async (req, res) => {
  try {
    const { name, supplierId } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Car name is required' });
    if (!supplierId)   return res.status(400).json({ success: false, error: 'supplierId is required' });

    const car = await Car.create({ name: name.trim(), supplierId });
    res.status(201).json({ success: true, data: car });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** PUT /api/cars/:id */
exports.update = async (req, res) => {
  try {
    const { name, supplierId } = req.body;
    const updates = {};
    if (name?.trim())  updates.name = name.trim();
    if (supplierId)    updates.supplierId = supplierId;

    const car = await Car.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
    res.json({ success: true, data: car });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** DELETE /api/cars/:id */
exports.remove = async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
    res.json({ success: true, message: 'Car deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
