const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const veiculosRoutes = require('./routes/veiculos');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS UNIVERSAL - Aceita qualquer origem
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentar limite para upload de imagens
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/veiculos', veiculosRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor da concessionária funcionando',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rota raiz - resposta mais completa
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: '🚀 API da Concessionária AutoPremium - ONLINE',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            docs: '/api/health',
            auth: '/api/auth',
            veiculos: '/api/veiculos'
        },
        status: {
            server: 'online',
            database: 'connected',
            environment: process.env.NODE_ENV || 'development'
        }
    });
});

// Rota da API raiz
app.get('/api', (req, res) => {
    res.json({ 
        message: 'API AutoPremium - Endpoints disponíveis',
        endpoints: {
            health: '/api/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me'
            },
            veiculos: {
                list: 'GET /api/veiculos',
                get: 'GET /api/veiculos/:id',
                create: 'POST /api/veiculos',
                update: 'PUT /api/veiculos/:id',
                delete: 'DELETE /api/veiculos/:id'
            }
        }
    });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('❌ Erro no servidor:', error);
    res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
    });
});

// Rota não encontrada
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Rota não encontrada',
        path: req.originalUrl,
        available_endpoints: ['/', '/api', '/api/health', '/api/veiculos', '/api/auth']
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 URL do Render: https://concessionaria-backend-1.onrender.com`);
    console.log(`✅ Backend pronto para receber requisições!`);
});

module.exports = app;
