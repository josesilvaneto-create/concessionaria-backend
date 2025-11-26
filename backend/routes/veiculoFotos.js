// routes/veiculoFotos.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configuração do multer para upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/veiculos/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'veiculo-' + req.params.veiculoId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
});

// GET - Listar fotos de um veículo
router.get('/veiculo/:veiculoId', async (req, res) => {
  try {
    const { veiculoId } = req.params;
    
    // Aqui você buscaria as fotos do banco de dados
    const fotos = await FotoVeiculo.find({ veiculo_id: veiculoId });
    
    res.json({
      success: true,
      data: fotos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST - Upload de foto
router.post('/veiculo/:veiculoId', upload.single('foto'), async (req, res) => {
  try {
    const { veiculoId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi enviada'
      });
    }

    // Salvar no banco de dados
    const novaFoto = new FotoVeiculo({
      veiculo_id: veiculoId,
      nome_arquivo: req.file.filename,
      caminho: req.file.path,
      mimetype: req.file.mimetype,
      tamanho: req.file.size
    });

    await novaFoto.save();

    res.json({
      success: true,
      data: novaFoto,
      message: 'Foto uploadada com sucesso'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE - Remover foto
router.delete('/:fotoId', async (req, res) => {
  try {
    const { fotoId } = req.params;
    
    const foto = await FotoVeiculo.findById(fotoId);
    if (!foto) {
      return res.status(404).json({
        success: false,
        error: 'Foto não encontrada'
      });
    }

    // Remover arquivo físico
    fs.unlinkSync(foto.caminho);
    
    // Remover do banco
    await FotoVeiculo.findByIdAndDelete(fotoId);

    res.json({
      success: true,
      message: 'Foto removida com sucesso'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
