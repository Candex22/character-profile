// ---------- Cargar carpetas desde Supabase ----------

async function loadFolders() {
    try {
        if (!viewingUserId) return;

        const { data, error } = await supabaseClient
            .from('folders')
            .select('*')
            .eq('user_id', viewingUserId)
            .order('name');

        if (error) throw error;

        folders = data || [];
        updateFolderBreadcrumb();
        renderFolders();
    } catch (error) {
        showNotification(`Error al cargar carpetas: ${error.message}`, 'error');
    }
}

// ---------- Utilidades de jerarquía ----------

// Devuelve el camino completo (de raíz a la carpeta actual) como array de carpetas
function getFolderPath(folderId) {
    const path = [];
    let current = folders.find(f => f.id === folderId);
    while (current) {
        path.unshift(current);
        current = current.parent_id ? folders.find(f => f.id === current.parent_id) : null;
    }
    return path;
}

// ---------- Crear carpeta ----------

function showAddFolderDialog() {
    addFolderDialog.classList.remove('hidden');
    document.getElementById('new-folder-name').value = '';
}

function hideAddFolderDialog() {
    addFolderDialog.classList.add('hidden');
}

async function addNewFolder(e) {
    e.preventDefault();

    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('Debes iniciar sesión para crear carpetas', 'error');
        return;
    }

    const name = document.getElementById('new-folder-name').value.trim();
    if (!name) {
        showNotification('Por favor, introduce un nombre para la carpeta', 'error');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('folders')
            .insert([{ user_id: currentUser.id, name, parent_id: currentFolderId }])
            .select();

        if (error) throw error;

        folders.push(data[0]);
        renderFolders();
        hideAddFolderDialog();
        showNotification('Carpeta creada con éxito');
    } catch (error) {
        showNotification(`Error al crear la carpeta: ${error.message}`, 'error');
    }
}

// ---------- Renombrar carpeta ----------

async function renameFolder(folderId) {
    if (!currentUser || viewingUserId !== currentUser.id) return;

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newName = prompt('Nuevo nombre de la carpeta:', folder.name);
    if (newName === null) return;

    const trimmed = newName.trim();
    if (!trimmed || trimmed === folder.name) return;

    try {
        const { error } = await supabaseClient
            .from('folders')
            .update({ name: trimmed })
            .eq('id', folderId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        folder.name = trimmed;
        renderFolders();
        updateFolderBreadcrumb();
        showNotification('Carpeta renombrada');
    } catch (error) {
        showNotification(`Error al renombrar la carpeta: ${error.message}`, 'error');
    }
}

// ---------- Eliminar carpeta ----------

async function deleteFolder(folderId) {
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para eliminar esta carpeta', 'error');
        return;
    }

    const hasSubfolders = folders.some(f => f.parent_id === folderId);
    const confirmMsg = hasSubfolders
        ? '¿Eliminar esta carpeta? Los personajes que contiene quedarán sin carpeta y las subcarpetas pasarán a la raíz.'
        : '¿Eliminar esta carpeta? Los personajes que contiene no se eliminarán, solo quedarán sin carpeta.';

    if (!confirm(confirmMsg)) return;

    try {
        // Desvincular los personajes de la carpeta
        const { error: updateError } = await supabaseClient
            .from('characters')
            .update({ folder_id: null })
            .eq('folder_id', folderId)
            .eq('user_id', currentUser.id);

        if (updateError) throw updateError;

        // Subir las subcarpetas al nivel de la carpeta eliminada
        const { error: subfolderError } = await supabaseClient
            .from('folders')
            .update({ parent_id: null })
            .eq('parent_id', folderId)
            .eq('user_id', currentUser.id);

        if (subfolderError) throw subfolderError;

        const { error } = await supabaseClient
            .from('folders')
            .delete()
            .eq('id', folderId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        characters.forEach(c => {
            if (c.folder_id === folderId) c.folder_id = null;
        });
        folders.forEach(f => {
            if (f.parent_id === folderId) f.parent_id = null;
        });
        folders = folders.filter(f => f.id !== folderId);

        if (currentFolderId === folderId) {
            openFolder(null);
        } else {
            renderFolders();
            renderCharacterCircles();
        }

        showNotification('Carpeta eliminada');
    } catch (error) {
        showNotification(`Error al eliminar la carpeta: ${error.message}`, 'error');
    }
}

// ---------- Navegación entre carpetas ----------

function openFolder(folderId) {
    currentFolderId = folderId;
    updateFolderBreadcrumb();
    renderFolders();
    renderCharacterCircles();
}

function updateFolderBreadcrumb() {
    if (!folderBreadcrumb) return;

    if (currentFolderId === null) {
        folderBreadcrumb.classList.add('hidden');
        return;
    }

    folderBreadcrumb.classList.remove('hidden');

    const path = getFolderPath(currentFolderId);
    folderBreadcrumbTrail.innerHTML = '';

    path.forEach((folder, index) => {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '/';
        folderBreadcrumbTrail.appendChild(separator);

        const isLast = index === path.length - 1;

        if (isLast) {
            const current = document.createElement('span');
            current.className = 'breadcrumb-current';
            current.textContent = folder.name;
            folderBreadcrumbTrail.appendChild(current);
        } else {
            const crumb = document.createElement('button');
            crumb.type = 'button';
            crumb.className = 'breadcrumb-link breadcrumb-crumb';
            crumb.textContent = folder.name;
            crumb.addEventListener('click', () => openFolder(folder.id));
            folderBreadcrumbTrail.appendChild(crumb);
        }
    });
}

// ---------- Mover personaje a carpeta (diálogo) ----------

function showMoveToFolderDialog(characterId) {
    characterIdToMove = characterId;

    moveToFolderSelect.innerHTML = '';

    const rootOption = document.createElement('option');
    rootOption.value = '';
    rootOption.textContent = 'Sin carpeta';
    moveToFolderSelect.appendChild(rootOption);

    // Ordenar mostrando la jerarquía (indentado) en vez de una lista plana
    const addOptionsRecursive = (parentId, depth) => {
        folders
            .filter(f => (f.parent_id || null) === parentId)
            .forEach(folder => {
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = `${'— '.repeat(depth)}${folder.name}`;
                moveToFolderSelect.appendChild(option);
                addOptionsRecursive(folder.id, depth + 1);
            });
    };
    addOptionsRecursive(null, 0);

    const character = characters.find(c => c.id === characterId);
    moveToFolderSelect.value = character && character.folder_id ? character.folder_id : '';

    moveToFolderDialog.classList.remove('hidden');
}

function hideMoveToFolderDialog() {
    moveToFolderDialog.classList.add('hidden');
    characterIdToMove = null;
}

async function moveCharacterToFolder(e) {
    e.preventDefault();
    if (!characterIdToMove) return;

    const newFolderId = moveToFolderSelect.value || null;
    await assignCharacterToFolderDirect(characterIdToMove, newFolderId, false);
    hideMoveToFolderDialog();
}

// ---------- Mover personaje a carpeta (directo, usado por drag & drop y el diálogo) ----------

async function assignCharacterToFolderDirect(characterId, folderId, notify = true) {
    if (!currentUser || viewingUserId !== currentUser.id) return;

    try {
        const { error } = await supabaseClient
            .from('characters')
            .update({ folder_id: folderId })
            .eq('id', characterId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        const character = characters.find(c => c.id === characterId);
        if (character) character.folder_id = folderId;

        renderFolders();
        renderCharacterCircles();

        const folder = folders.find(f => f.id === folderId);
        showNotification(folder ? `Movido a "${folder.name}"` : 'Personaje movido a Sin carpeta');
    } catch (error) {
        showNotification(`Error al mover el personaje: ${error.message}`, 'error');
    }
}