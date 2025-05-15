let loginDialog, loginForm, logoutBtn, userInfoDisplay, publicLibrariesBtn;

// Estado de autenticación
let currentUser = null;
let viewingUserId = null;
let viewingUsername = null; // Para almacenar el nombre del usuario cuya biblioteca estamos viendo

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
    
    // Botón de cerrar sesión
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        currentUser = null;
        updateUIForAuthState();
        showLoginDialog();
        showNotification('Sesión cerrada');
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
        viewingUsername = userData.username; // Inicialmente vemos nuestra propia biblioteca
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
        
        // Actualizar el título de la biblioteca dependiendo de si es propia o ajena
        if (isOwnLibrary) {
            document.getElementById('library-owner-info').textContent = 'Mi biblioteca de personajes';
        } else {
            document.getElementById('library-owner-info').textContent = `Biblioteca de ${viewingUsername || 'otro usuario'}`;
        }
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

// Mostrar bibliotecas públicas (con mejor manejo de errores y debugging)
async function showPublicLibraries() {
    try {
        console.log('Consultando usuarios en la base de datos...');
        
        // Para depuración: Verificar que supabaseClient esté inicializado correctamente
        if (!window.supabaseClient) {
            console.error('Error: Cliente de Supabase no está inicializado');
            showNotification('Error de conexión: El cliente de Supabase no está inicializado', 'error');
            return;
        }
        
        // Para depuración: Mostrar información sobre la conexión
        console.log('Estado de la conexión Supabase:', !!window.supabaseClient);
        
        // Realizar la consulta con mejor manejo de errores
        const { data: users, error, status, statusText } = await supabaseClient
            .from('users')
            .select('id, username');
        
        // Depuración detallada
        console.log('Respuesta completa:', { data: users, error, status, statusText });
        
        if (error) {
            console.error('Error al obtener usuarios:', error);
            
            // Mensajes de error más específicos según el código de error
            if (error.code === 'PGRST116') {
                showNotification('Error: La tabla "users" no existe en la base de datos', 'error');
            } else if (error.code === '42501') {
                showNotification('Error de permisos: No tienes acceso a la tabla de usuarios', 'error');
            } else {
                showNotification(`Error al cargar usuarios: ${error.message}`, 'error');
            }
            return;
        }
        
        console.log('Usuarios obtenidos:', users);
        
        // Como solución temporal si no hay usuarios en la DB, crear algunos usuarios de prueba
        // para que la funcionalidad siga funcionando
        if (!users || users.length === 0) {
            console.warn('No se encontraron usuarios en la DB, usando datos de muestra');
            
            // Crear usuarios de muestra para demostración
            const mockUsers = [
                { id: '1', username: 'Usuario Demo 1' },
                { id: '2', username: 'Usuario Demo 2' },
                { id: '3', username: 'Usuario Demo 3' }
            ];
            
            // Si el usuario actual existe, añadirlo a la lista de usuarios de muestra
            if (currentUser && currentUser.id) {
                // Verificar si ya existe un usuario con este ID en mockUsers
                const userExists = mockUsers.some(u => u.id === currentUser.id);
                
                if (!userExists) {
                    mockUsers.push({
                        id: currentUser.id,
                        username: currentUser.username || currentUser.email || 'Usuario Actual'
                    });
                }
            }
            
            // Usar los usuarios de muestra en lugar de la respuesta vacía
            users = mockUsers;
            
            showNotification('Usando datos de demostración (la base de datos está vacía)', 'error');
        }
        
        // Crear diálogo para mostrar usuarios
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.id = 'public-libraries-dialog';
        
        const dialogContent = document.createElement('div');
        dialogContent.className = 'dialog';
        
        // Añadir título con descripción mejorada
        dialogContent.innerHTML = `
            <h2>Bibliotecas Disponibles</h2>
            <p class="library-info">Todas las bibliotecas son públicas. Puedes ver cualquier biblioteca, pero solo editar la tuya.</p>
            <div class="users-list">
                ${users.map(user => {
                    const isCurrentUser = currentUser && user.id === currentUser.id;
                    return `
                    <div class="user-item ${isCurrentUser ? 'current-user' : ''}" data-user-id="${user.id}" data-username="${user.username}">
                        <span class="user-name">${user.username || 'Usuario sin nombre'} ${isCurrentUser ? '(Tú)' : ''}</span>
                        <button class="view-library-btn">Ver biblioteca</button>
                    </div>
                    `;
                }).join('')}
            </div>
            <div class="dialog-buttons">
                <button id="close-public-libraries" class="button secondary">Cerrar</button>
            </div>
        `;
        
        dialog.appendChild(dialogContent);
        document.body.appendChild(dialog);
        
        // Añadir estilos para mejorar la visualización
        const style = document.createElement('style');
        style.textContent = `
            .library-info {
                margin-bottom: 15px;
                color: #666;
            }
            .users-list {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 20px;
            }
            .user-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            .user-item.current-user {
                background-color: rgba(var(--primary-color-rgb), 0.1);
            }
            .view-library-btn {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        
        // Configurar eventos
        document.querySelectorAll('.view-library-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userItem = btn.parentElement;
                const userId = userItem.dataset.userId;
                const username = userItem.dataset.username;
                
                console.log(`Cambiando a la biblioteca de usuario ID: ${userId}, Usuario: ${username}`);
                
                viewingUserId = userId;
                viewingUsername = username; // Guardar el nombre del usuario que estamos viendo
                
                await loadCharacters();
                updateUIForAuthState();
                dialog.remove();
                style.remove();
                
                showNotification(`Viendo la biblioteca de ${username || 'otro usuario'}`);
            });
        });
        
        document.getElementById('close-public-libraries').addEventListener('click', () => {
            dialog.remove();
            style.remove();
        });
    } catch (e) {
        console.error('Error inesperado al mostrar bibliotecas:', e);
        showNotification(`Error inesperado: ${e.message}`, 'error');
    }
}

// Cargar mi biblioteca
function loadMyLibrary() {
    if (currentUser) {
        viewingUserId = currentUser.id;
        viewingUsername = currentUser.username; // Estamos viendo nuestra propia biblioteca
        loadCharacters();
        updateUIForAuthState();
        showNotification('Cargando tu biblioteca');
    }
}

// Iniciar autenticación cuando DOM esté listo
document.addEventListener('DOMContentLoaded', initAuth);