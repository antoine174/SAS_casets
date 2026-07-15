'use strict';

const router     = require('express').Router();
const controller = require('../_controllers/bulkImport');

// POST /api/parts/bulk-analyze
router.post('/bulk-analyze', controller.analyze);

// POST /api/parts/bulk-commit
router.post('/bulk-commit',  controller.commit);

module.exports = router;
