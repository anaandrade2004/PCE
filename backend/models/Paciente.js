const pool = require('../config/db');

class Paciente {
  static async criar({ numero_utente, nome, data_nascimento, sexo, peso, altura, telefone }) {
    const query = `
      INSERT INTO pacientes (numero_utente, nome, data_nascimento, sexo, peso, altura, telefone) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`;
    const values = [numero_utente, nome, data_nascimento, sexo, peso, altura, telefone];
    return pool.query(query, values);
  }

  static async buscarTodos() {
    return pool.query("SELECT * FROM pacientes");
  }

  static async buscarPorNumeroUtente(numero_utente) {
    return pool.query("SELECT * FROM pacientes WHERE numero_utente = $1", [numero_utente]);
  }
}

module.exports = Paciente;