// auth.js
// Referencias a elementos del DOM para autenticación
const loginDialog = document.getElementById('login-dialog');
const registerDialog = document.getElementById('register-dialog');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const userInfoDisplay = document.getElementById('user-info');
const switchToRegisterBtn = document.getElementById('switch-to-register');
const switchToLoginBtn = document.getElementById('switch-to-login');
const publicLibrariesBtn = document.getElementById('public-libraries-btn');

// Estado de autenticación
let currentUser = null;
let viewingUserId = null;

// Inicialización de autenticación
async function initAuth() {
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
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            await setAuthenticatedUser(data.user);
            hideLoginDialog();
            showNotification('Sesión iniciada correctamente');
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
        }
    });
    
    // Formulario de registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            // Registrar el usuario
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username
                    }
                }
            });
            
            if (error) throw error;
            
            // Crear perfil de usuario en la tabla usuarios
            const { error: profileError } = await supabaseClient
                .from('users')
                .insert([
                    { id: data.user.id, username, email }
                ]);
                
            if (profileError) throw profileError;
            
            await setAuthenticatedUser(data.user);
            hideRegisterDialog();
            showNotification('Cuenta creada correctamente');
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
        }
    });
    
    // Botón de cerrar sesión
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        currentUser = null;
        updateUIForAuthState();
        showLoginDialog();
        showNotification('Sesión cerrada');
    });
    
    // Cambiar entre diálogos
    switchToRegisterBtn.addEventListener('click', () => {
        hideLoginDialog();
        showRegisterDialog();
    });
    
    switchToLoginBtn.addEventListener('click', () => {
        hideRegisterDialog();
        showLoginDialog();
    });
    
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

// Mostrar diálogo de registro
function showRegisterDialog() {
    registerDialog.classList.remove('hidden');
}

// Ocultar diálogo de registro
function hideRegisterDialog() {
    registerDialog.classList.add('hidden');
}

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