'use strict';

const mongoose = require('mongoose');

const partSchema = new mongoose.Schema(
  {
    partNo: {
      type: String,
      required: [true, 'Part number is required'],
      trim: true,
      index: true,
    },
    partName: { type: String, trim: true },
    materialType: { type: String, trim: true },
    materialSource: { type: String, trim: true },
    unitPrice: {
      type: Number,
      min: [0, 'Unit price cannot be negative'],
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 4,
        message: 'A part can have at most 4 images',
      },
      default: [],
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: [true, 'Car reference is required'],
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
    },
  },
  { timestamps: true }
);

// Compound index for fast lookups during bulk import analysis
partSchema.index({ partNo: 1, supplierId: 1 });

module.exports = mongoose.models.Part || mongoose.model('Part', partSchema);
