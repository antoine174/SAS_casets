'use strict';

const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure once on module load
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Upload a single Buffer to Cloudinary.
 * @param {Buffer} buffer  — file buffer from multer memoryStorage
 * @param {string} folder  — Cloudinary folder path
 * @returns {Promise<string>} secure_url
 */
function uploadBuffer(buffer, folder = 'sas_clearance/parts') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    // Convert buffer to readable stream and pipe into Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Upload multiple file buffers (from req.files) to Cloudinary in parallel.
 * @param {Express.Multer.File[]} files — array of multer file objects
 * @param {string} folder
 * @returns {Promise<string[]>} array of secure_urls
 */
async function uploadFiles(files, folder = 'sas_clearance/parts') {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((f) => uploadBuffer(f.buffer, folder)));
}

/**
 * Delete a Cloudinary image by its public_id.
 * @param {string} publicId
 */
async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadBuffer, uploadFiles, deleteImage };
