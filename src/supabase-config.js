// supabase-config.js
const SUPABASE_URL = 'https://zmprtmlyqnzzrkdzbrot.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptcHJ0bWx5cW56enJrZHpicm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjgwODksImV4cCI6MjA2MDQ0NDA4OX0.hoRSB20BZPeE6Mdlc_DiwzI0pxkFCl_1TyRr2UzKdvA';

// Función para inicializar Supabase
function initSupabase() {
    try {
        console.log('Inicializando cliente de Supabase...');
        
        // Verifica que la biblioteca supabase esté cargada
        if (typeof supabase === 'undefined') {
            console.error('Error: La biblioteca de Supabase no está disponible');
            return false;
        }
        
        // Crea el cliente de Supabase
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        console.log('Cliente de Supabase inicializado correctamente');
        return true;
    } catch (error) {
        console.error('Error al inicializar Supabase:', error);
        return false;
    }
}

// Inicializar inmediatamente si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSupabase();
} else {
    // De lo contrario, esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', initSupabase);
}