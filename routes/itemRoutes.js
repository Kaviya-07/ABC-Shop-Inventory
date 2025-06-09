const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.get('/', itemController.getAllItems);

router.get('/items/add', itemController.showAddForm);

router.post('/items/add', itemController.addItem);

router.get('/items/edit/:id', itemController.showEditForm);

router.put('/items/edit/:id', itemController.updateItem);


router.delete('/items/delete/:id', itemController.deleteItem);


router.get('/items/sell/:id', async (req, res) => {
  const Item = require('../models/Item');
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).send('Item not found');
  res.render('items/sell', { item });
});

router.post('/items/sell/:id', itemController.sellItem);

router.get('/items/purchase/:id', async (req, res) => {
  const Item = require('../models/Item');
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).send('Item not found');
  res.render('items/purchase', { item });
});

router.post('/items/purchase/:id', itemController.purchaseItem);

router.get('/items/report/:id', itemController.showReport);

module.exports = router;
