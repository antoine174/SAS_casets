'use strict';

const Supplier = require('../_models/Supplier');

/** GET /api/suppliers */
exports.getAll = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** POST /api/suppliers */
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name is required' });

    const supplier = await Supplier.create({ name: name.trim() });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Supplier name already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

/** PUT /api/suppliers/:id */
exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name is required' });

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Supplier name already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

/** DELETE /api/suppliers/:id */
exports.remove = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
