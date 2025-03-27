const { Pool } = require('pg');

const pool = new Pool({
    user: 'nextgen_user',        // Usuário do PostgreSQL
    host: 'localhost',          // Host do banco (ou IP do servidor)
    database: 'projeto',      // Nome do banco de dados
    password: 'nextgen_password',      // Senha do usuário
    port: 5432,                 // Porta padrão do PostgreSQL
});

module.exports = pool;
