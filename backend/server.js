const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const veiculosRoutes = require('./routes/veiculos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/veiculos', veiculosRoutes);

// Rota health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Bem-vindo à API da Concessionária',
    version: '1.0.0'
  });
});

// Rota para listar endpoints
app.get('/api', (req, res) => {
  res.json({
    success: true,
    endpoints: {
      auth: '/api/auth',
      veiculos: '/api/veiculos', 
      health: '/api/health'
    }
  });
});

// Middleware de erro 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl,
    available_endpoints: [
      '/',
      '/api', 
      '/api/health',
      '/api/veiculos',
      '/api/auth'
    ]
  });
});

// Inicialização do servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
