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

    // Obtener datos del perfil del usuario, intentando diferentes tablas
    let userData = null;
    let error = null;

    // Intentar primero en la tabla 'users'
    const usersResult = await supabaseClient
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

    if (!usersResult.error) {
        userData = usersResult.data;
    } else {
        console.log('No se encontró el usuario en la tabla users, intentando profiles...');

        // Intentar con la tabla 'profiles'
        const profilesResult = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

        if (!profilesResult.error) {
            userData = profilesResult.data;
        } else {
            console.error('No se pudo obtener el perfil del usuario:', profilesResult.error);
            error = profilesResult.error;
        }
    }

    if (!error && userData) {
        currentUser.username = userData.username;
        viewingUsername = userData.username; // Inicialmente vemos nuestra propia biblioteca
    } else {
        // Si no hay perfil, usar el email como nombre de usuario
        currentUser.username = user.email ? user.email.split('@')[0] : 'Usuario';
        viewingUsername = currentUser.username;

        // Intentar crear un perfil para el usuario si no existe
        try {
            // Primero averiguar qué tabla existe
            const { error: checkUsersError } = await supabaseClient
                .from('users')
                .select('id')
                .limit(1);

            const { error: checkProfilesError } = await supabaseClient
                .from('profiles')
                .select('id')
                .limit(1);

            // Determinar qué tabla usar para crear el perfil
            const tableToUse = !checkUsersError ? 'users' : (!checkProfilesError ? 'profiles' : null);

            if (tableToUse) {
                console.log(`Creando perfil de usuario en la tabla ${tableToUse}...`);

                const { error: insertError } = await supabaseClient
                    .from(tableToUse)
                    .insert({
                        id: user.id,
                        username: currentUser.username,
                        created_at: new Date().toISOString()
                    });

                if (insertError) {
                    console.error(`Error al crear perfil en ${tableToUse}:`, insertError);
                } else {
                    console.log('Perfil creado correctamente');
                }
            }
        } catch (e) {
            console.error('Error al intentar crear perfil:', e);
        }
    }

    updateUIForAuthState();
    loadCharacters();
}

// Actualizar la interfaz según el estado de autenticación
function updateUIForAuthState() {
    if (currentUser) {
        // Usuario logueado
        userInfoDisplay.textContent = `Hola, ${currentUser.username || currentUser.email}!`;
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

// Mostrar bibliotecas públicas (mejorado para trabajar con usuarios reales)
async function showPublicLibraries() {
    try {
        console.log('Consultando usuarios en la base de datos...');

        // Verificar que supabaseClient esté inicializado correctamente
        if (!window.supabaseClient) {
            console.error('Error: Cliente de Supabase no está inicializado');
            showNotification('Error de conexión: El cliente de Supabase no está inicializado', 'error');
            return;
        }

        // Log del estado de la conexión
        console.log('Estado de la conexión Supabase:', !!window.supabaseClient);

        // Primero, intentar consultar desde la tabla 'users' (tabla estándar de perfiles)
        let { data: usersFromProfiles, error: profilesError } = await supabaseClient
            .from('users')
            .select('id, username')
            .order('username');

        console.log('Intento de consulta en tabla users:', {
            data: usersFromProfiles,
            error: profilesError
        });

        // Variable para almacenar los usuarios
        let users = usersFromProfiles || [];
        console.log('Usuarios obtenidos:', users);

        // Crear diálogo para mostrar usuarios
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.id = 'public-libraries-dialog';

        const dialogContent = document.createElement('div');
        dialogContent.className = 'dialog wider-dialog'; // Clase adicional para diálogo más ancho

        // Añadir título con descripción mejorada y estado de DB
        dialogContent.innerHTML = `
            <h2>Bibliotecas Disponibles</h2>
            <p class="library-info">Todas las bibliotecas son públicas. Puedes ver cualquier biblioteca, pero solo editar la tuya.</p>
            <div class="db-status ${users === usersFromProfiles ? 'success' : 'warning'}">
                <i class="fas ${users === usersFromProfiles ? 'fa-database' : 'fa-exclamation-triangle'}"></i>
                <span>${users === usersFromProfiles ? 'Usuarios cargados desde la base de datos' : 'Usando datos de demostración'}</span>
            </div>
            <div class="users-list">
                ${users.map(user => {
            const isCurrentUser = currentUser && user.id === currentUser.id;
            return `
                    <div class="user-item ${isCurrentUser ? 'current-user' : ''}" data-user-id="${user.id}" data-username="${user.username || ''}">
                        <span class="user-name">${user.username || 'Usuario sin nombre'} ${isCurrentUser ? '(Tú)' : ''}</span>
                        <button class="view-library-btn">Ver biblioteca</button>
                    </div>
                    `;
        }).join('')}
            </div>
            <div class="dialog-buttons">
                <button id="close-public-libraries" class="button secondary">Cerrar</button>
                ${users !== usersFromProfiles ? `
                <button id="setup-db-info" class="button primary">
                    <i class="fas fa-info-circle"></i> Información de configuración
                </button>` : ''}
            </div>
        `;

        dialog.appendChild(dialogContent);
        document.body.appendChild(dialog);

        // Añadir estilos para mejorar la visualización
        const style = document.createElement('style');
        style.textContent = `
            .wider-dialog {
                max-width: 600px;
                width: 90%;
            }
            .library-info {
                margin-bottom: 15px;
                color: #666;
            }
            .db-status {
                padding: 10px;
                margin-bottom: 15px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .db-status.success {
                background-color: rgba(0, 128, 0, 0.1);
                color: green;
            }
            .db-status.warning {
                background-color: rgba(255, 165, 0, 0.1);
                color: orange;
            }
            .users-list {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 20px;
                border: 1px solid #eee;
                border-radius: 5px;
            }
            .user-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #eee;
            }
            .user-item:last-child {
                border-bottom: none;
            }
            .user-item.current-user {
                background-color: rgba(var(--primary-color-rgb), 0.1);
            }
            .view-library-btn {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .view-library-btn:hover {
                background-color: var(--primary-color-dark, #005fa3);
            }
            #setup-db-info {
                margin-left: 10px;
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



        document.getElementById('close-config-info').addEventListener('click', () => {
            configDialog.remove();
            configStyle.remove();
        });
    } catch (error){
        console.error('Error inesperado al mostrar bibliotecas:', error);
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