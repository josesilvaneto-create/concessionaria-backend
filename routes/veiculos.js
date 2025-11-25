const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar todos os veículos (público)
router.get('/', async (req, res) => {
    try {
        const { data: veiculos, error } = await supabase
            .from('veiculos')
            .select('*')
            .eq('disponivel', true)
            .order('criado_em', { ascending: false });

        if (error) {
            console.error('Erro ao buscar veículos:', error);
            return res.status(500).json({ error: 'Erro ao buscar veículos' });
        }

        res.json({ veiculos });
    } catch (error) {
        console.error('Erro ao listar veículos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter um veículo específico (público)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: veiculo, error } = await supabase
            .from('veiculos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar veículo:', error);
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        res.json({ veiculo });
    } catch (error) {
        console.error('Erro ao buscar veículo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar novo veículo (protegido)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            marca,
            modelo,
            ano,
            preco,
            quilometragem,
            combustivel,
            cor,
            descricao
        } = req.body;

        // Validações básicas
        if (!marca || !modelo || !ano || !preco) {
            return res.status(400).json({ error: 'Marca, modelo, ano e preço são obrigatórios' });
        }

        const { data: novoVeiculo, error } = await supabase
            .from('veiculos')
            .insert([
                {
                    marca,
                    modelo,
                    ano,
                    preco,
                    quilometragem: quilometragem || 0,
                    combustivel: combustivel || 'Flex',
                    cor: cor || 'Não informada',
                    descricao: descricao || '',
                    disponivel: true,
                    criado_por: req.userId,
                    criado_em: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar veículo:', error);
            return res.status(500).json({ error: 'Erro ao criar veículo' });
        }

        res.status(201).json({
            message: 'Veículo criado com sucesso',
            veiculo: novoVeiculo
        });

    } catch (error) {
        console.error('Erro ao criar veículo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar veículo (protegido)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verificar se o veículo existe e pertence ao usuário
        const { data: veiculo, error: checkError } = await supabase
            .from('veiculos')
            .select('criado_por')
            .eq('id', id)
            .single();

        if (checkError || !veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        // Apenas o criador pode editar (ou admin no futuro)
        if (veiculo.criado_por !== req.userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este veículo' });
        }

        const { data: veiculoAtualizado, error } = await supabase
            .from('veiculos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar veículo:', error);
            return res.status(500).json({ error: 'Erro ao atualizar veículo' });
        }

        res.json({
            message: 'Veículo atualizado com sucesso',
            veiculo: veiculoAtualizado
        });

    } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Excluir veículo (protegido)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o veículo existe e pertence ao usuário
        const { data: veiculo, error: checkError } = await supabase
            .from('veiculos')
            .select('criado_por')
            .eq('id', id)
            .single();

        if (checkError || !veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        // Apenas o criador pode excluir (ou admin no futuro)
        if (veiculo.criado_por !== req.userId) {
            return res.status(403).json({ error: 'Sem permissão para excluir este veículo' });
        }

        const { error } = await supabase
            .from('veiculos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir veículo:', error);
            return res.status(500).json({ error: 'Erro ao excluir veículo' });
        }

        res.json({ message: 'Veículo excluído com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;