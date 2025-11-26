// routes/veiculoFotos.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/veiculos/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'veiculo-' + req.params.veiculoId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
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
    
    // Verificar se o diretório de uploads existe
    const uploadDir = 'uploads/veiculos/';
    if (!fs.existsSync(uploadDir)) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Buscar arquivos no diretório
    const files = fs.readdirSync(uploadDir)
      .filter(file => file.includes(`veiculo-${veiculoId}-`))
      .map(file => {
        return {
          nome_arquivo: file,
          caminho: `/uploads/veiculos/${file}`,
          url: `${req.protocol}://${req.get('host')}/uploads/veiculos/${file}`
        };
      });
    
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
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

    const fileData = {
      veiculo_id: veiculoId,
      nome_arquivo: req.file.filename,
      caminho: req.file.path,
      url: `${req.protocol}://${req.get('host')}/uploads/veiculos/${req.file.filename}`,
      mimetype: req.file.mimetype,
      tamanho: req.file.size,
      data_upload: new Date()
    };

    res.json({
      success: true,
      data: fileData,
      message: 'Foto uploadada com sucesso'
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
