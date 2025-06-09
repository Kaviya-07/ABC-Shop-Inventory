const Item = require('../models/Item');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');

exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find().lean();

    items.forEach(item => {
      item.isLowStock = item.quantity <= item.reorderPoint;
    });

    res.render('items/index', { items });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


exports.showAddForm = (req, res) => {
  res.render('items/add');
};


exports.addItem = async (req, res) => {
  try {
    const { name, quantity, reorderPoint, price } = req.body;

    const existingItem = await Item.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    if (existingItem) {
      return res.render('items/add', {
        error: 'Item already exists',
        name,
        quantity,
        reorderPoint,
        price
      });
    }

    const newItem = new Item({ name, quantity, reorderPoint, price });
    await newItem.save();
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error adding item');
  }
};


exports.showEditForm = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send('Item not found');
    res.render('items/edit', { item });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { name, quantity, reorderPoint, price } = req.body;
    await Item.findByIdAndUpdate(req.params.id, { name, quantity, reorderPoint, price });
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error updating item');
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error deleting item');
  }
};

exports.sellItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send('Item not found');

    if (item.quantity < quantity) {
      return res.status(400).send('Insufficient quantity for sale');
    }

    item.quantity -= Number(quantity);
    await item.save();

    const sale = new Sale({
      item: item._id,
      quantity: Number(quantity)
    });
    await sale.save();

    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error selling item');
  }
};

exports.purchaseItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send('Item not found');

    item.quantity += Number(quantity);
    await item.save();

    const purchase = new Purchase({
      item: item._id,
      quantity: Number(quantity)
    });
    await purchase.save();

    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error purchasing item');
  }
};

exports.showReport = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).send('Item not found');

    const sales = await Sale.aggregate([
      { $match: { item: item._id } },
      { $group: { _id: '$item', totalSold: { $sum: '$quantity' } } }
    ]);

    const totalSold = sales.length ? sales[0].totalSold : 0;

    res.render('items/report', { item, totalSold });
  } catch (err) {
    res.status(500).send('Error generating report');
  }
};
