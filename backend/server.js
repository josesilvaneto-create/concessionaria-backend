require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client inicializado');

// CORS
app.use(cors({
    origin: ['https://concessionaria-frontend.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Prefer']
}));

app.use(express.json({ limit: '10mb' }));

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(403).json({ error: 'Token inválido' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// ROTAS DE AUTENTICAÇÃO
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, nome } = req.body;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nome: nome } }
        });

        if (error) throw error;

        if (data.user) {
            await supabase.from('usuarios').insert([
                { id: data.user.id, email: data.user.email, nome: nome }
            ]);
        }

        res.json({
            message: 'Usuário registrado com sucesso',
            user: { id: data.user.id, email: data.user.email, nome: nome }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: userData } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .single();

        res.json({
            message: 'Login realizado com sucesso',
            token: data.session.access_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                nome: userData?.nome || data.user.user_metadata.nome
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ROTAS DE VEÍCULOS
app.get('/api/veiculos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('veiculos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ veiculos: data });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar veículos' });
    }
});

app.get('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('veiculos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Veículo não encontrado' });

        res.json({ veiculo: data });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar veículo' });
    }
});

app.post('/api/veiculos', authenticateToken, async (req, res) => {
    try {
        const { marca, modelo, ano, preco, quilometragem, combustivel, cor, descricao } = req.body;

        const { data, error } = await supabase
            .from('veiculos')
            .insert([{
                marca, modelo, ano, preco, quilometragem, combustivel, cor, descricao,
                criado_por: req.user.id, disponivel: true, created_at: new Date()
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Veículo cadastrado com sucesso', veiculo: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/veiculos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const { data, error } = await supabase
            .from('veiculos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Veículo atualizado com sucesso', veiculo: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend da concessionária funcionando',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚗 Backend concessionária rodando na porta ${PORT}`);
});
