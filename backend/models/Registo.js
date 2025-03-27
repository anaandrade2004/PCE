const pool = require('../config/db');

class Registo {
  static async criar({ numero_utente, dados }) {
    const query = `
      INSERT INTO registos (numero_utente, dados, created_at) 
      VALUES ($1, $2, NOW()) 
      RETURNING *`;
    return pool.query(query, [numero_utente, dados]);
  }

  static async buscarPorPaciente(numero_utente) {
    return pool.query(
      "SELECT * FROM registos WHERE numero_utente = $1 ORDER BY created_at DESC",
      [numero_utente]
    );
  }

  static async buscarTodos() {
    return pool.query("SELECT * FROM registos ORDER BY created_at DESC");
  }
}

module.exports = Registo;