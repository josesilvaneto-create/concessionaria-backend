const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rotas
const authRoutes = require('./routes/auth');
const veiculosRoutes = require('./routes/veiculos');

// Inicializar app PRIMEIRO
const app = express();
const PORT = process.env.PORT || 10000;

// Configuração do CORS - DEPOIS do app
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware - DEPOIS da configuração
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/veiculos', veiculosRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor da concessionária funcionando',
        timestamp: new Date().toISOString()
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({ 
        message: 'API da Concessionária AutoPremium',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            veiculos: '/api/veiculos',
            health: '/api/health'
        }
    });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro:', error);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
    });
});

// Rota não encontrada
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Não configurado'}`);
});

module.exports = app;
