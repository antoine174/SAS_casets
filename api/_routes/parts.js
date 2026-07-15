'use strict';

const router     = require('express').Router();
const upload     = require('../_middlewares/upload');
const controller = require('../_controllers/parts');

router.get('/',       controller.getAll);
router.post('/',      upload.array('images', 4), controller.create);
router.put('/:id',    upload.array('images', 4), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
