const express = require('express');
const router = express.Router();
const {
  listContracts,
  getContractDetail,
  createContract,
  updateContract,
  deleteContract,
  importContracts,
} = require('../controllers/contractController');

router.get('/', listContracts);
router.post('/import', importContracts);
router.get('/:id', getContractDetail);
router.post('/', createContract);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

module.exports = router;

