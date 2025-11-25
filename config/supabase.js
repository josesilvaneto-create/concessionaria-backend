const { createClient } = require('@supabase/supabase-js');

// Usar valores padrão para desenvolvimento
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';

// Apenas logar um aviso em vez de quebrar a aplicação
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn('⚠️  Variáveis de ambiente do Supabase não configuradas - usando valores placeholder');
    console.warn('⚠️  Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no Render');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
