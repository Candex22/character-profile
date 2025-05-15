let loginDialog, loginForm, logoutBtn, userInfoDisplay, publicLibrariesBtn;

// Estado de autenticación
let currentUser = null;
let viewingUserId = null;

// Inicialización cuando DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Obtener referencias a elementos DOM - eliminar referencias a registro
    loginDialog = document.getElementById('login-dialog');
    loginForm = document.getElementById('login-form');
    logoutBtn = document.getElementById('logout-btn');
    userInfoDisplay = document.getElementById('user-info');
    publicLibrariesBtn = document.getElementById('public-libraries-btn');
    
    // Verificar si Supabase ya está inicializado
    if (window.supabaseClient) {
        initAuth();
    } else {
        // Esperar a que Supabase esté listo
        document.addEventListener('supabaseReady', initAuth);
    }
});

// Inicialización de autenticación
async function initAuth() {
    console.log('Inicializando autenticación...');
    // Comprobar si hay una sesión activa
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (session) {
        await setAuthenticatedUser(session.user);
    } else {
        showLoginDialog();
    }
    
    setupAuthEventListeners();
}

// Configurar eventos de autenticación
function setupAuthEventListeners() {
    // Formulario de inicio de sesión
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            console.log('Intentando iniciar sesión con:', email);
            
            // Verifica que supabaseClient exista
            if (!window.supabaseClient) {
                throw new Error('Cliente de Supabase no inicializado');
            }
            
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                console.error('Error de Supabase:', error);
                throw error;
            }
            
            console.log('Inicio de sesión exitoso:', data);
            
            await setAuthenticatedUser(data.user);
            hideLoginDialog();
            showNotification('Sesión iniciada correctamente');
        } catch (error) {
            console.error('Error completo durante el inicio de sesión:', error);
            
            // Mensajes de error más específicos
            if (error.message.includes('Invalid login credentials')) {
                showNotification('Correo o contraseña incorrectos', 'error');
            } else if (error.message.includes('Email not confirmed')) {
                showNotification('Por favor, confirma tu correo electrónico antes de iniciar sesión', 'error');
            } else {
                showNotification(`Error: ${error.message}`, 'error');
            }
        }
    });
    
    // Eliminar toda la sección de registro
    
    // Botón de cerrar sesión
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        currentUser = null;
        updateUIForAuthState();
        showLoginDialog();
        showNotification('Sesión cerrada');
    });
    
    // Eliminar sección de cambio entre diálogos
    
    // Ver bibliotecas públicas
    publicLibrariesBtn.addEventListener('click', showPublicLibraries);
}

// Establecer usuario autenticado
async function setAuthenticatedUser(user) {
    currentUser = user;
    viewingUserId = user.id;
    
    // Obtener datos del perfil del usuario
    const { data: userData, error } = await supabaseClient
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
        
    if (!error && userData) {
        currentUser.username = userData.username;
    }
    
    updateUIForAuthState();
    loadCharacters();
}

// Actualizar la interfaz según el estado de autenticación
function updateUIForAuthState() {
    if (currentUser) {
        // Usuario logueado
        userInfoDisplay.textContent = `Hola, ${currentUser.username || currentUser.email}`;
        userInfoDisplay.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        publicLibrariesBtn.classList.remove('hidden');
        
        // Si estamos viendo nuestra propia biblioteca
        const isOwnLibrary = viewingUserId === currentUser.id;
        addCharacterBtn.classList.toggle('hidden', !isOwnLibrary);
        document.getElementById('library-owner-info').textContent = isOwnLibrary ? 
            'Mi biblioteca de personajes' : 
            'Biblioteca de otro usuario';
    } else {
        // Usuario no logueado
        userInfoDisplay.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        publicLibrariesBtn.classList.add('hidden');
        addCharacterBtn.classList.add('hidden');
    }
}

// Mostrar diálogo de inicio de sesión
function showLoginDialog() {
    loginDialog.classList.remove('hidden');
}

// Ocultar diálogo de inicio de sesión
function hideLoginDialog() {
    loginDialog.classList.add('hidden');
}

// Eliminar funciones de registro
// function showRegisterDialog() { ... }
// function hideRegisterDialog() { ... }

// Mostrar bibliotecas públicas
async function showPublicLibraries() {
    const { data: users, error } = await supabaseClient
        .from('users')
        .select('id, username');
        
    if (error) {
        showNotification(`Error: ${error.message}`, 'error');
        return;
    }
    
    // Crear diálogo para mostrar usuarios
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.id = 'public-libraries-dialog';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog';
    
    dialogContent.innerHTML = `
        <h2>Bibliotecas Públicas</h2>
        <div class="users-list">
            ${users.map(user => `
                <div class="user-item" data-user-id="${user.id}">
                    <span class="user-name">${user.username}</span>
                    <button class="view-library-btn">Ver biblioteca</button>
                </div>
            `).join('')}
        </div>
        <div class="dialog-buttons">
            <button id="close-public-libraries" class="button secondary">Cerrar</button>
        </div>
    `;
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
    
    // Configurar eventos
    document.querySelectorAll('.view-library-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.parentElement.dataset.userId;
            viewingUserId = userId;
            await loadCharacters();
            updateUIForAuthState();
            dialog.remove();
        });
    });
    
    document.getElementById('close-public-libraries').addEventListener('click', () => {
        dialog.remove();
    });
}

// Cargar mi biblioteca
function loadMyLibrary() {
    if (currentUser) {
        viewingUserId = currentUser.id;
        loadCharacters();
        updateUIForAuthState();
    }
}

// Iniciar autenticación cuando DOM esté listo
document.addEventListener('DOMContentLoaded', initAuth);