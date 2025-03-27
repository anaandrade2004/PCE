const express = require('express');
const router = express.Router();
const {
  criarPaciente,
  listarPacientes,
  buscarPaciente
} = require('../controllers/pacienteController');

router.post('/', criarPaciente);
router.get('/', listarPacientes);
router.get('/:numero_utente', buscarPaciente);

module.exports = router;