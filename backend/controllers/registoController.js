const Registro = require('../models/Registo');

exports.criarRegisto = async (req, res) => {
  try {
    const { numero_utente, dados } = req.body;
    
    // Validação básica da estrutura do JSON
    if (!dados?.data || !dados?.state || !dados?.protocol) {
      return res.status(400).json({ error: "Estrutura de dados inválida" });
    }

    const result = await Registro.criar({ numero_utente, dados });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao guardar registo:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

exports.listarRegistos = async (req, res) => {
  try {
    const result = await Registro.buscarTodos();
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar registos:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

exports.buscarRegistosPaciente = async (req, res) => {
  try {
    const { numero_utente } = req.params;
    const result = await Registro.buscarPorPaciente(numero_utente);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Nenhum registo encontrado" });
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar registos:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};