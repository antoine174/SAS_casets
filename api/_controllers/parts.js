'use strict';

const Part       = require('../_models/Part');
const { uploadFiles } = require('../_utils/cloudinary');

/** GET /api/parts?carId=&supplierId=&search= */
exports.getAll = async (req, res) => {
  try {
    const { carId, supplierId, search } = req.query;
    const filter = {};

    if (carId)      filter.carId      = carId;
    if (supplierId) filter.supplierId = supplierId;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ partNo: regex }, { partName: regex }];
    }

    const parts = await Part.find(filter)
      .populate('carId', 'name')
      .populate('supplierId', 'name')
      .sort({ partNo: 1 });

    res.json({ success: true, data: parts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** POST /api/parts  (multipart/form-data) */
exports.create = async (req, res) => {
  try {
    const { partNo, partName, materialType, materialSource, unitPrice, carId, supplierId } = req.body;

    if (!partNo?.trim())  return res.status(400).json({ success: false, error: 'partNo is required' });
    if (!carId)           return res.status(400).json({ success: false, error: 'carId is required' });
    if (!supplierId)      return res.status(400).json({ success: false, error: 'supplierId is required' });

    // Upload images to Cloudinary
    const imageUrls = await uploadFiles(req.files || []);

    const part = await Part.create({
      partNo: partNo.trim(),
      partName,
      materialType,
      materialSource,
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
      images: imageUrls,
      carId,
      supplierId,
    });

    res.status(201).json({ success: true, data: part });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** PUT /api/parts/:id  (multipart/form-data) */
exports.update = async (req, res) => {
  try {
    const { partNo, partName, materialType, materialSource, unitPrice, existingImages } = req.body;

    // existingImages is a JSON string of URLs to keep from the original set
    let keptImages = [];
    try {
      keptImages = existingImages ? JSON.parse(existingImages) : [];
    } catch (_) { keptImages = []; }

    // Upload any new files
    const newUrls = await uploadFiles(req.files || []);
    const allImages = [...keptImages, ...newUrls].slice(0, 4);

    const updates = { partName, materialType, materialSource, images: allImages };
    if (partNo?.trim())          updates.partNo    = partNo.trim();
    if (unitPrice !== undefined) updates.unitPrice = Number(unitPrice);

    const part = await Part.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!part) return res.status(404).json({ success: false, error: 'Part not found' });

    res.json({ success: true, data: part });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** DELETE /api/parts/:id */
exports.remove = async (req, res) => {
  try {
    const part = await Part.findByIdAndDelete(req.params.id);
    if (!part) return res.status(404).json({ success: false, error: 'Part not found' });
    res.json({ success: true, message: 'Part deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
