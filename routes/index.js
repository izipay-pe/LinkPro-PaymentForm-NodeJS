var express = require('express');
var router = express.Router();

const checkoutController = require("../controllers/paidController");
const controller = require('../controllers/paidController');

/* GET home page. */
router.get('/', checkoutController.home);
router.post('/',checkoutController.paidUrl)
router.post('/result', checkoutController.paidResult);
router.post('/ipn', checkoutController.ipn);
router.post('/link', checkoutController.openLink);

module.exports = router;
