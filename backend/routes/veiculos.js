const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar todos os veículos com imagens
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

        // Adicionar URLs das imagens para cada veículo
        const veiculosComImagens = await Promise.all(
            veiculos.map(async (veiculo) => {
                try {
                    // Listar todas as imagens do veículo
                    const { data: imagens, error: storageError } = await supabase
                        .storage
                        .from('veiculos-imagens')
                        .list(`veiculo-${veiculo.id}`);

                    if (storageError) {
                        console.log(`Nenhuma imagem encontrada para veículo ${veiculo.id}:`, storageError.message);
                        return {
                            ...veiculo,
                            imagens: [],
                            imagem_principal: 'https://via.placeholder.com/300x200/2c3e50/ffffff?text=Sem+Imagem'
                        };
                    }

                    // Gerar URLs públicas para cada imagem
                    const imagensComUrl = imagens.map(imagem => {
                        const { data: urlData } = supabase
                            .storage
                            .from('veiculos-imagens')
                            .getPublicUrl(`veiculo-${veiculo.id}/${imagem.name}`);
                        
                        return urlData.publicUrl;
                    });

                    console.log(`Veículo ${veiculo.id} tem ${imagensComUrl.length} imagens`);

                    return {
                        ...veiculo,
                        imagens: imagensComUrl,
                        imagem_principal: imagensComUrl[0] || 'https://via.placeholder.com/300x200/2c3e50/ffffff?text=Sem+Imagem'
                    };
                } catch (error) {
                    console.error(`Erro ao carregar imagens do veículo ${veiculo.id}:`, error);
                    return {
                        ...veiculo,
                        imagens: [],
                        imagem_principal: 'https://via.placeholder.com/300x200/2c3e50/ffffff?text=Sem+Imagem'
                    };
                }
            })
        );

        res.json({ veiculos: veiculosComImagens });
    } catch (error) {
        console.error('Erro ao listar veículos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter um veículo específico com imagens
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

        // Carregar imagens do veículo
        try {
            const { data: imagens, error: storageError } = await supabase
                .storage
                .from('veiculos-imagens')
                .list(`veiculo-${id}`);

            const imagensComUrl = imagens ? imagens.map(imagem => {
                const { data: urlData } = supabase
                    .storage
                    .from('veiculos-imagens')
                    .getPublicUrl(`veiculo-${id}/${imagem.name}`);
                
                return urlData.publicUrl;
            }) : [];

            res.json({ 
                veiculo: {
                    ...veiculo,
                    imagens: imagensComUrl,
                    imagem_principal: imagensComUrl[0] || 'https://via.placeholder.com/300x200/2c3e50/ffffff?text=Sem+Imagem'
                }
            });
        } catch (storageError) {
            console.error('Erro ao carregar imagens:', storageError);
            res.json({ 
                veiculo: {
                    ...veiculo,
                    imagens: [],
                    imagem_principal: 'https://via.placeholder.com/300x200/2c3e50/ffffff?text=Sem+Imagem'
                }
            });
        }

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

        console.log('📥 Dados recebidos:', req.body);
        console.log('👤 Usuário autenticado:', req.userId);

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
            console.error('❌ Erro ao criar veículo:', error);
            return res.status(500).json({ error: 'Erro ao criar veículo no banco de dados' });
        }

        console.log('✅ Veículo criado com sucesso:', novoVeiculo);

        res.status(201).json({
            message: 'Veículo criado com sucesso',
            veiculo: novoVeiculo
        });

    } catch (error) {
        console.error('❌ Erro ao criar veículo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Upload de imagem para veículo (protegido)
router.post('/:id/imagens', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { imagem } = req.body; // Base64 da imagem

        console.log('📤 Recebendo upload para veículo:', id);

        if (!imagem) {
            return res.status(400).json({ error: 'Imagem é obrigatória' });
        }

        // Verificar se o veículo existe e pertence ao usuário
        const { data: veiculo, error: veiculoError } = await supabase
            .from('veiculos')
            .select('criado_por')
            .eq('id', id)
            .single();

        if (veiculoError || !veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        // Apenas o criador pode adicionar fotos
        if (veiculo.criado_por !== req.userId) {
            return res.status(403).json({ error: 'Sem permissão para adicionar fotos a este veículo' });
        }

        // Converter base64 para buffer
        const base64Data = imagem.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Nome único para a imagem
        const nomeArquivo = `imagem-${Date.now()}.jpg`;
        const caminho = `veiculo-${id}/${nomeArquivo}`;

        console.log('🖼️ Fazendo upload para:', caminho);

        // Upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('veiculos-imagens')
            .upload(caminho, buffer, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (uploadError) {
            console.error('❌ Erro no upload:', uploadError);
            return res.status(500).json({ error: 'Erro ao fazer upload da imagem: ' + uploadError.message });
        }

        console.log('✅ Upload realizado com sucesso:', uploadData);

        // Obter URL pública
        const { data: urlData } = supabase
            .storage
            .from('veiculos-imagens')
            .getPublicUrl(caminho);

        console.log('🔗 URL pública gerada:', urlData.publicUrl);

        res.json({ 
            success: true, 
            url: urlData.publicUrl,
            message: 'Imagem adicionada com sucesso' 
        });

    } catch (error) {
        console.error('❌ Erro no upload de imagem:', error);
        res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
});

// Listar imagens de um veículo específico
router.get('/:id/imagens', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: imagens, error } = await supabase
            .storage
            .from('veiculos-imagens')
            .list(`veiculo-${id}`);

        if (error) {
            console.error('Erro ao listar imagens:', error);
            return res.status(404).json({ error: 'Nenhuma imagem encontrada para este veículo' });
        }

        const imagensComUrl = imagens.map(imagem => {
            const { data: urlData } = supabase
                .storage
                .from('veiculos-imagens')
                .getPublicUrl(`veiculo-${id}/${imagem.name}`);
            
            return {
                nome: imagem.name,
                url: urlData.publicUrl,
                criado_em: imagem.created_at
            };
        });

        res.json({ imagens: imagensComUrl });

    } catch (error) {
        console.error('Erro ao listar imagens:', error);
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

        // Apenas o criador pode editar
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

        // Apenas o criador pode excluir
        if (veiculo.criado_por !== req.userId) {
            return res.status(403).json({ error: 'Sem permissão para excluir este veículo' });
        }

        // Primeiro excluir as imagens do storage
        try {
            const { data: imagens } = await supabase
                .storage
                .from('veiculos-imagens')
                .list(`veiculo-${id}`);

            if (imagens && imagens.length > 0) {
                const pathsToDelete = imagens.map(imagem => `veiculo-${id}/${imagem.name}`);
                await supabase
                    .storage
                    .from('veiculos-imagens')
                    .remove(pathsToDelete);
                
                console.log(`🗑️ ${imagens.length} imagens excluídas do veículo ${id}`);
            }
        } catch (storageError) {
            console.error('Erro ao excluir imagens:', storageError);
            // Continua mesmo se houver erro na exclusão das imagens
        }

        // Excluir o veículo
        const { error } = await supabase
            .from('veiculos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir veículo:', error);
            return res.status(500).json({ error: 'Erro ao excluir veículo' });
        }

        res.json({ message: 'Veículo e suas imagens excluídos com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Excluir imagem específica (protegido)
router.delete('/:id/imagens/:nomeImagem', authMiddleware, async (req, res) => {
    try {
        const { id, nomeImagem } = req.params;

        // Verificar se o veículo existe e pertence ao usuário
        const { data: veiculo, error: checkError } = await supabase
            .from('veiculos')
            .select('criado_por')
            .eq('id', id)
            .single();

        if (checkError || !veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        // Apenas o criador pode excluir imagens
        if (veiculo.criado_por !== req.userId) {
            return res.status(403).json({ error: 'Sem permissão para excluir imagens deste veículo' });
        }

        const caminho = `veiculo-${id}/${nomeImagem}`;

        const { error } = await supabase
            .storage
            .from('veiculos-imagens')
            .remove([caminho]);

        if (error) {
            console.error('Erro ao excluir imagem:', error);
            return res.status(500).json({ error: 'Erro ao excluir imagem' });
        }

        res.json({ message: 'Imagem excluída com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir imagem:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
