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
        
        // Si hay un error con 'users', intentar con 'profiles' (otra convención común)
        if (profilesError && profilesError.code === 'PGRST116') {
            console.log('Tabla users no encontrada, intentando con profiles...');
            const { data: usersFromAltTable, error: altError } = await supabaseClient
                .from('profiles')
                .select('id, username')
                .order('username');
                
            if (!altError) {
                usersFromProfiles = usersFromAltTable;
                profilesError = null;
                console.log('Consulta exitosa en tabla profiles:', usersFromProfiles);
            } else {
                console.error('Error al consultar tabla profiles:', altError);
            }
        }
        
        // Si todavía hay error, intentar obtener directamente de auth.users
        if (profilesError) {
            console.log('Intentando obtener usuarios directamente de auth.users...');
            try {
                // Esta es una operación que normalmente requeriría privilegios admin
                // y solo funcionará si tu política RLS lo permite
                const { data: authUsers, error: authError } = await supabaseClient
                    .from('auth.users')
                    .select('id, email');
                    
                if (!authError && authUsers) {
                    // Convertir los usuarios de auth a nuestro formato
                    usersFromProfiles = authUsers.map(user => ({
                        id: user.id,
                        username: user.email.split('@')[0] // Usar la parte local del email como username
                    }));
                    profilesError = null;
                    console.log('Consulta exitosa en auth.users:', usersFromProfiles);
                } else {
                    console.error('Error al consultar auth.users:', authError);
                }
            } catch (authQueryError) {
                console.error('No se pudo acceder a auth.users:', authQueryError);
            }
        }
        
        // Si sigue habiendo un error, mostrar mensaje específico
        if (profilesError) {
            console.error('Error al obtener usuarios:', profilesError);
            
            // Mensajes de error más específicos
            if (profilesError.code === 'PGRST116') {
                showNotification('Error: No se encontró ninguna tabla de usuarios en la base de datos', 'error');
            } else if (profilesError.code === '42501') {
                showNotification('Error de permisos: No tienes acceso a las tablas de usuarios', 'error');
            } else {
                showNotification(`Error al cargar usuarios: ${profilesError.message}`, 'error');
            }
            
            // Preguntar al usuario si desea continuar con datos de muestra
            if (confirm('No se pudieron cargar los usuarios de la base de datos. ¿Deseas continuar con datos de ejemplo para probar la funcionalidad?')) {
                // Continuar con usuarios demo
            } else {
                return; // Salir si el usuario no quiere usar datos demo
            }
        }
        
        // Variable para almacenar los usuarios
        let users = usersFromProfiles || [];
        console.log('Usuarios obtenidos:', users);
        
        // Si no hay usuarios en la DB, crear algunos usuarios de prueba
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
            
            showNotification('Usando datos de demostración (la base de datos está vacía)', 'warning');
        }
        
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
        
        // Botón de información de configuración (solo si usamos datos demo)
        const setupInfoBtn = document.getElementById('setup-db-info');
        if (setupInfoBtn) {
            setupInfoBtn.addEventListener('click', () => {
                // Mostrar un diálogo con información de configuración
                const configDialog = document.createElement('div');
                configDialog.className = 'dialog-overlay';
                
                const configContent = document.createElement('div');
                configContent.className = 'dialog';
                configContent.innerHTML = `
                    <h2>Configuración de la Base de Datos</h2>
                    <div class="config-info">
                        <p>Para que la funcionalidad de bibliotecas públicas funcione correctamente, necesitas configurar tu base de datos en Supabase.</p>
                        
                        <h3>1. Crear tabla de usuarios</h3>
                        <p>Ejecuta el siguiente SQL en el editor SQL de Supabase:</p>
                        <pre class="code-block">
CREATE TABLE public.users (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    username TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configurar seguridad RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas: cualquiera puede ver, solo el dueño puede editar
CREATE POLICY "Usuarios visibles para todos" 
ON public.users FOR SELECT USING (true);

CREATE POLICY "Usuarios solo actualizables por el propietario" 
ON public.users FOR UPDATE USING (auth.uid() = id);
                        </pre>
                        
                        <h3>2. Crear tabla de personajes</h3>
                        <p>Ejecuta este SQL para crear la tabla de personajes:</p>
                        <pre class="code-block">
CREATE TABLE public.characters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configurar seguridad RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Políticas: cualquiera puede ver, solo el dueño puede editar/eliminar
CREATE POLICY "Personajes visibles para todos" 
ON public.characters FOR SELECT USING (true);

CREATE POLICY "Personajes insertables por usuarios autenticados" 
ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Personajes actualizables por el propietario" 
ON public.characters FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Personajes eliminables por el propietario" 
ON public.characters FOR DELETE USING (auth.uid() = user_id);
                        </pre>
                        
                        <h3>3. Configurar almacenamiento</h3>
                        <p>Crea un bucket de almacenamiento llamado "character-images" y configura las políticas de seguridad adecuadas.</p>
                    </div>
                    <div class="dialog-buttons">
                        <button id="close-config-info" class="button primary">Entendido</button>
                    </div>
                `;
                
                configDialog.appendChild(configContent);
                document.body.appendChild(configDialog);
                
                // Estilos para el diálogo de configuración
                const configStyle = document.createElement('style');
                configStyle.textContent = `
                    .config-info {
                        max-height: 400px;
                        overflow-y: auto;
                        padding-right: 10px;
                    }
                    .code-block {
                        background-color: #f5f5f5;
                        padding: 12px;
                        border-radius: 4px;
                        overflow-x: auto;
                        font-family: monospace;
                        font-size: 12px;
                        line-height: 1.4;
                        margin: 10px 0;
                        white-space: pre;
                        color: #333;
                    }
                `;
                document.head.appendChild(configStyle);
                
                document.getElementById('close-config-info').addEventListener('click', () => {
                    configDialog.remove();
                    configStyle.remove();
                });
            });
        }
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