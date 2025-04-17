// supabase-config.js
const SUPABASE_URL = 'https://zmprtmlyqnzzrkdzbrot.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptcHJ0bWx5cW56enJrZHpicm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjgwODksImV4cCI6MjA2MDQ0NDA4OX0.hoRSB20BZPeE6Mdlc_DiwzI0pxkFCl_1TyRr2UzKdvA';

// Inicializar cliente de Supabase correctamente
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Exportar el cliente
window.supabaseClient = supabaseClient;