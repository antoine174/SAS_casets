'use strict';

const Part = require('../_models/Part');

/**
 * POST /api/parts/bulk-analyze
 * Body: { supplierId, carId, items: [{ partNo, partName, unitPrice }] }
 *
 * Returns three strict categories:
 *  - matched   : exists in DB, price is identical
 *  - conflicts : exists in DB, price differs  → { partNo, partName, oldPrice, newPrice, _id }
 *  - newItems  : does not exist in DB
 */
exports.analyze = async (req, res) => {
  try {
    const { supplierId, carId, items } = req.body;

    if (!supplierId) return res.status(400).json({ success: false, error: 'supplierId is required' });
    if (!carId)      return res.status(400).json({ success: false, error: 'carId is required' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items must be a non-empty array' });
    }

    // Pull all existing parts that match any incoming partNo + same supplier
    const incomingPartNos = items.map((i) => i.partNo);
    const existing = await Part.find({
      partNo: { $in: incomingPartNos },
      supplierId,
    }).lean();

    // Build a lookup map: partNo → existing doc
    const existingMap = {};
    existing.forEach((p) => { existingMap[p.partNo] = p; });

    const matched   = [];
    const conflicts = [];
    const newItems  = [];

    for (const item of items) {
      const dbPart = existingMap[item.partNo];

      if (!dbPart) {
        newItems.push({ ...item, carId, supplierId });
      } else if (Number(dbPart.unitPrice) === Number(item.unitPrice)) {
        matched.push({ ...item, _id: dbPart._id });
      } else {
        conflicts.push({
          _id:      dbPart._id,
          partNo:   item.partNo,
          partName: item.partName ?? dbPart.partName,
          oldPrice: dbPart.unitPrice,
          newPrice: Number(item.unitPrice),
        });
      }
    }

    res.json({ success: true, data: { matched, conflicts, new: newItems } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/parts/bulk-commit
 * Body: {
 *   supplierId,
 *   carId,
 *   updates: [{ _id, unitPrice }],      ← resolved conflicts or forced updates
 *   inserts: [{ partNo, partName, unitPrice, materialType, materialSource }]
 * }
 */
exports.commit = async (req, res) => {
  try {
    const { supplierId, carId, updates = [], inserts = [] } = req.body;

    if (!supplierId) return res.status(400).json({ success: false, error: 'supplierId is required' });
    if (!carId)      return res.status(400).json({ success: false, error: 'carId is required' });

    // Build bulkWrite operations
    const ops = [];

    // UPDATE operations (resolved conflicts / forced price overrides)
    for (const u of updates) {
      ops.push({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { unitPrice: u.unitPrice } },
        },
      });
    }

    // INSERT operations (new parts)
    for (const ins of inserts) {
      ops.push({
        insertOne: {
          document: {
            partNo:         ins.partNo,
            partName:       ins.partName,
            materialType:   ins.materialType   || '',
            materialSource: ins.materialSource || '',
            unitPrice:      Number(ins.unitPrice),
            images:         [],
            carId,
            supplierId,
          },
        },
      });
    }

    let result = { ok: true, nModified: 0, nInserted: 0 };
    if (ops.length > 0) {
      const bw = await Part.bulkWrite(ops, { ordered: false });
      result = {
        ok:         true,
        nModified:  bw.modifiedCount,
        nInserted:  bw.insertedCount,
      };
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
