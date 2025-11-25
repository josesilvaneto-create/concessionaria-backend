const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const veiculosRoutes = require('./routes/veiculos');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuração do CORS CORRIGIDA
const corsOptions = {
    origin: [
        'https://concessionaria-frontend.vercel.app' ,
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... resto do código permanece igual
app.use('/api/auth', authRoutes);
app.use('/api/veiculos', veiculosRoutes);

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor da concessionária funcionando',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 CORS configurado para: ${corsOptions.origin.join(', ')}`);
});



