const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret_aqui';

// Cadastro de usuário
router.post('/register', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        // Validações básicas
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se o usuário já existe
        const { data: existingUser, error: checkError } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'E-mail já cadastrado' });
        }

        // Hash da senha
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // Inserir usuário no banco
        const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert([
                {
                    nome,
                    email,
                    senha_hash: senhaHash,
                    criado_em: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Erro ao criar usuário:', insertError);
            return res.status(500).json({ error: 'Erro ao criar usuário' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Retornar dados do usuário (sem a senha)
        const userResponse = {
            id: newUser.id,
            nome: newUser.nome,
            email: newUser.email
        };

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validações básicas
        if (!email || !senha) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
        }

        // Buscar usuário
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, user.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Retornar dados do usuário (sem a senha)
        const userResponse = {
            id: user.id,
            nome: user.nome,
            email: user.email
        };

        res.json({
            message: 'Login realizado com sucesso',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Logout (simples - o token é invalidado no cliente)
router.post('/logout', authMiddleware, (req, res) => {
    res.json({ message: 'Logout realizado com sucesso' });
});

// Obter dados do usuário atual
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('id, nome, email')
            .eq('id', req.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
