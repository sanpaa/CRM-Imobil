const express = require('express');
const multer = require('multer');

const router = express.Router();

// Memory storage para trabalhar com Supabase
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
    }
  }
});

function createUploadRoutes(storageService) {
  router.post(
    '/',
    (req, res, next) => {
      // Handler personalizado para capturar erros do Multer
      upload.array('images', 10)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          console.error('MulterError:', err.code, err.message);
          
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              error: 'Arquivo muito grande. Máximo: 5MB por imagem' 
            });
          }
          if (err.code === 'UNEXPECTED_FIELD') {
            return res.status(400).json({ 
              error: 'Campo inválido. Use "images" para enviar arquivos',
              details: `Campo esperado: "images". Campo recebido: ${err.field || 'desconhecido'}`
            });
          }
          return res.status(400).json({ 
            error: `Erro no upload: ${err.message}`,
            code: err.code 
          });
        } else if (err) {
          console.error('Upload error:', err);
          return res.status(500).json({ 
            error: err.message || 'Erro ao processar upload'
          });
        }
        next();
      });
    },
    async (req, res) => {
      try {
        // Validar se arquivos foram enviados
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ 
            error: 'Nenhuma imagem foi enviada',
            details: 'Certifique-se de enviar arquivos no campo "images"'
          });
        }

        console.log(`📤 Recebidos ${req.files.length} arquivo(s) para upload`);

        // Verificar se storage está disponível
        const isAvailable = await storageService.isAvailable();
        
        if (!isAvailable) {
          const bucketName = storageService.getBucketName();
          console.error('❌ Supabase Storage não disponível');
          return res.status(503).json({ 
            error: `❌ Bucket "${bucketName}" não encontrado no Supabase Storage`,
            details: 'O bucket de armazenamento não existe ou não está acessível.',
            documentation: 'Execute "npm run storage:setup" para criar o bucket. Veja STORAGE_SETUP.md',
            helpCommands: [
              'npm run storage:setup - Verificar e criar bucket',
              'npm run verify - Verificar configuração completa'
            ]
          });
        }

        // Upload para Supabase Storage
        const { urls, errors, errorCodes } = await storageService.uploadFiles(req.files);

        // Verificar se todos falharam
        if (urls.length === 0) {
          const errorDetails = errors.length > 0 ? errors.join('; ') : 'Motivo desconhecido';
          const bucketName = storageService.getBucketName();
          
          console.error('❌ Todos os uploads falharam:', errorDetails);
          
          // Detectar erro de bucket
          const isBucketError = errorCodes.some(code => 
            code === '404' || code === 'BUCKET_NOT_FOUND'
          ) || errorDetails.toLowerCase().includes('bucket');
          
          return res.status(500).json({ 
            error: isBucketError 
              ? `❌ Bucket "${bucketName}" não encontrado` 
              : 'Erro ao fazer upload das imagens',
            details: errorDetails,
            documentation: isBucketError 
              ? 'Execute "npm run storage:setup" para criar o bucket. Veja STORAGE_SETUP.md'
              : `Verifique se o bucket "${bucketName}" existe e está público no Supabase.`,
            helpCommands: isBucketError ? ['npm run storage:setup', 'npm run verify'] : undefined
          });
        }

        // Alguns uploads falharam
        if (errors.length > 0) {
          console.warn(`⚠️ ${errors.length} de ${req.files.length} uploads falharam`);
          return res.json({ 
            imageUrls: urls,
            warning: `${urls.length} de ${req.files.length} imagens enviadas. ${errors.length} falharam.`,
            errors: errors
          });
        }

        // Sucesso total
        console.log(`✅ ${urls.length} imagem(ns) enviada(s) com sucesso`);
        res.json({ 
          imageUrls: urls,
          count: urls.length,
          message: `${urls.length} imagem(ns) enviada(s) com sucesso`
        });

      } catch (error) {
        console.error('❌ Erro no upload:', error);
        res.status(500).json({ 
          error: 'Erro ao processar upload',
          details: error.message 
        });
      }
    }
  );

  return router;
}

module.exports = createUploadRoutes;