'use strict';

const router     = require('express').Router();
const controller = require('../_controllers/cars');

router.get('/',    controller.getAll);
router.post('/',   controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
