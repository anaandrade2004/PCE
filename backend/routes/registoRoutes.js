const express = require('express');
const router = express.Router();
const {
  criarRegisto,
  listarRegistos,
  buscarRegistosPaciente
} = require('../controllers/registoController');

router.post('/', criarRegisto);
router.get('/', listarRegistos);
router.get('/:numero_utente', buscarRegistosPaciente);

module.exports = router;