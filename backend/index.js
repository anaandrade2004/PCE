const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 5001;

// Configurações
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Configuração do PostgreSQL
const pool = new Pool({
  user: 'nextgen_user',
  host: 'localhost',
  database: 'pce_forms',
  password: 'nextgen_password',
  port: 5432
});

const JSON_BACKUP_PATH = path.join(__dirname, 'compositions_backup.json');

// Função para extrair conteúdo de campos
const extractContent = (value) => {
  if (value === null || value === undefined) return null;
  
  // Se for string JSON (editor de texto)
  if (typeof value === 'string' && value.startsWith('{"blocks":')) {
    try {
      const parsed = JSON.parse(value);
      return parsed.blocks[0]?.text || null;
    } catch {
      return value;
    }
  }
  
  return value;
};

// Função para processar campos numéricos com unidades (versão corrigida)
const processNumericField = (formValues, basePath) => {
  const value = formValues[`${basePath}.value`];
  const unit = formValues[`${basePath}.unit`];
  
  if (value === undefined && unit === undefined) {
    return null;
  }

  const result = {};
  if (value !== undefined && value !== null) {
    result.value = value;
  }
  if (unit !== undefined && unit !== null) {
    result.unit = unit;
  }

  return Object.keys(result).length > 0 ? result : null;
};

// Função principal para processar os dados (versão corrigida)
const processFormData = (formValues) => {
  try {
    const getValue = (path) => extractContent(formValues[path]);
    
    const processDualField = (selectPath, commentPath, fieldName) => {
      const selected = getValue(selectPath);
      const comment = getValue(commentPath);
      
      const result = {};
      
      if (selected !== null && selected !== undefined) {
        result[fieldName] = selected;
      }
      
      if (comment) {
        result[`${fieldName}_comment`] = comment;
      }
      
      return result;
    };

    // Processar blood_pressure
    const blood_pressure = {
      ...processDualField('items.0.0.items.0.value', null, 'position'),
      ...processDualField('items.0.0.items.1.value', null, 'sleep_status'),
      inclination: processNumericField(formValues, 'items.0.0.items.2.value'),
      ...processDualField('items.0.0.items.3.value', null, 'cuff_size'),
      ...processDualField(
        'items.0.0.items.4.value', 
        'items.0.0.items.5.value', 
        'measurement_location'
      ),
      ...processDualField('items.0.0.items.6.value', null, 'method')
    };

    // Processar bmi
    const bmi = {
      ...processNumericField(formValues, 'items.0.1.items.0.value'),
      comment: getValue('items.0.1.items.1.value')
    };

    // Processar pulse_oximetry
    const pulse_oximetry = {
      sensor_location: getValue('items.0.2.items.0.value')
    };

    // Processar pulse
    const pulse = {
      ...processDualField('items.0.3.items.0.value', null, 'position'),
      ...processDualField('items.0.3.items.1.value', null, 'method'),
      ...processDualField(
        'items.0.3.items.2.value',
        'items.0.3.items.3.value',
        'body_location'
      )
    };

    // Processar respiration
    const respiration = {
      body_position: getValue('items.0.4.items.0.value')
    };

    // Processar body_temperature
    const body_temperature = {
      ...processDualField(
        'items.0.5.items.0.value',
        'items.0.5.items.1.value',
        'body_exposure'
      ),
      ...processDualField(
        'items.0.5.items.2.value',
        'items.0.5.items.3.value',
        'measurement_location'
      ),
      temperature: processNumericField(formValues, 'items.0.5.items.4.value')
    };

    // Construir o objeto final
    const formData = {
      blood_pressure: Object.keys(blood_pressure).length > 0 ? blood_pressure : undefined,
      bmi: Object.keys(bmi).length > 0 ? bmi : undefined,
      pulse_oximetry: Object.keys(pulse_oximetry).length > 0 ? pulse_oximetry : undefined,
      pulse: Object.keys(pulse).length > 0 ? pulse : undefined,
      respiration: Object.keys(respiration).length > 0 ? respiration : undefined,
      body_temperature: Object.keys(body_temperature).length > 0 ? body_temperature : undefined
    };

    // Remove campos nulos ou vazios
    const cleanData = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
          const cleanedValue = cleanData(value);
          if (cleanedValue !== null && cleanedValue !== undefined) {
            if (typeof cleanedValue === 'object' && !Array.isArray(cleanedValue)) {
              if (Object.keys(cleanedValue).length > 0) {
                cleaned[key] = cleanedValue;
              }
            } else {
              cleaned[key] = cleanedValue;
            }
          }
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    };

    return cleanData(formData);
  } catch (err) {
    console.error('Erro ao processar dados:', err);
    return null;
  }
};

// Rota POST
app.post('/api/compositions', async (req, res) => {
  try {
    if (!req.body?.composition) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados do formulário ausentes' 
      });
    }

    let composition = req.body.composition;
    if (typeof composition === 'string') {
      try {
        composition = JSON.parse(composition);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Formato de dados inválido'
        });
      }
    }

    const processedData = processFormData(composition);
    if (!processedData) {
      return res.status(400).json({
        success: false,
        error: 'Estrutura de dados inválida'
      });
    }

    const id = uuidv4();
    const created_at = new Date();

    const dbRecord = {
      id,
      created_at,
      form_data: processedData
    };

    const backupRecord = {
      id,
      created_at,
      form_data: processedData,
      raw_data: composition
    };

    await pool.query(
      'INSERT INTO public.formularios (id, forms, created_at) VALUES ($1, $2, $3)',
      [id, dbRecord, created_at]
    );

    let allBackups = [];
    if (fs.existsSync(JSON_BACKUP_PATH)) {
      allBackups = JSON.parse(fs.readFileSync(JSON_BACKUP_PATH));
    }
    allBackups.push(backupRecord);
    fs.writeFileSync(JSON_BACKUP_PATH, JSON.stringify(allBackups, null, 2));

    res.status(201).json({
      success: true,
      id,
      timestamp: created_at,
      data: processedData
    });

  } catch (err) {
    console.error('Erro no servidor:', err);
    res.status(500).json({
      success: false,
      error: 'Erro interno no servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Rotas GET
app.get('/api/compositions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, forms as form_data, created_at FROM public.formularios ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao buscar dados' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});