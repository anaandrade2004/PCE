const Paciente = require('../models/Paciente');

exports.criarPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.criar(req.body);
    res.status(201).json(paciente.rows[0]);
  } catch (err) {
    console.error("Erro ao inserir paciente:", err);
    res.status(500).send("Erro ao inserir paciente. Consulte o log de erros.");
  }
};

exports.listarPacientes = async (req, res) => {
  try {
    const result = await Paciente.buscarTodos();
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro ao obter pacientes.");
  }
};

exports.buscarPaciente = async (req, res) => {
  try {
    const { numero_utente } = req.params;
    const result = await Paciente.buscarPorNumeroUtente(numero_utente);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro ao buscar paciente.");
  }
};