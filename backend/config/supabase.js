const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Verificar se as variáveis existem, mas não quebrar a aplicação
if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  AVISO: Variáveis do Supabase não configuradas');
    console.warn('⚠️  Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no Render');
}

// Criar cliente mesmo com valores undefined (para não quebrar)
const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder-key'
);

console.log('✅ Supabase client inicializado');

module.exports = supabase;
