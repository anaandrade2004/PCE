require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pacienteRoutes = require('./routes/pacienteRoutes');
const registoRoutes = require('./routes/registoRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/registos', registoRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});