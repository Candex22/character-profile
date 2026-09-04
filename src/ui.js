// ---------- Notificaciones ----------

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';

    if (type === 'success') {
        notification.style.backgroundColor = 'var(--primary-color)';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
        notification.style.color = 'white';
    }

    document.body.appendChild(notification);

    setTimeout(() => { notification.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => { document.body.removeChild(notification); }, 300);
    }, 3000);
}

// ---------- Lightbox ----------

function setupLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxClose = document.getElementById('lightbox-close');

    lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });
}

function openLightbox(imageSrc) {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    lightboxImage.src = imageSrc;
    lightbox.classList.add('active');
}

function closeLightbox() {
    document.getElementById('image-lightbox').classList.remove('active');
}

// ---------- Carpetas ----------

function renderFolders() {
    if (!folderContainer) return;
    folderContainer.innerHTML = '';

    const isOwnLibrary = currentUser && viewingUserId === currentUser.id;

    const visibleFolders = folders.filter(f => (f.parent_id || null) === currentFolderId);

    visibleFolders.forEach(folder => {
        const folderEl = document.createElement('div');
        folderEl.className = 'folder-card';

        const count = characters.filter(c => c.folder_id === folder.id).length;
        const subfolderCount = folders.filter(f => f.parent_id === folder.id).length;

        const icon = document.createElement('div');
        icon.className = 'folder-icon';
        icon.innerHTML = '<i class="fas fa-folder"></i>';

        const name = document.createElement('div');
        name.className = 'folder-name';
        name.textContent = folder.name;

        const countEl = document.createElement('div');
        countEl.className = 'folder-count';
        const parts = [`${count} ${count === 1 ? 'personaje' : 'personajes'}`];
        if (subfolderCount > 0) {
            parts.push(`${subfolderCount} ${subfolderCount === 1 ? 'subcarpeta' : 'subcarpetas'}`);
        }
        countEl.textContent = parts.join(' · ');

        folderEl.appendChild(icon);
        folderEl.appendChild(name);
        folderEl.appendChild(countEl);

        folderEl.addEventListener('click', () => openFolder(folder.id));

        if (isOwnLibrary) {
            const actions = document.createElement('div');
            actions.className = 'folder-actions';

            const renameBtn = document.createElement('button');
            renameBtn.className = 'folder-action-btn';
            renameBtn.title = 'Renombrar carpeta';
            renameBtn.innerHTML = '<i class="fas fa-pen"></i>';
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                renameFolder(folder.id);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'folder-action-btn';
            deleteBtn.title = 'Eliminar carpeta';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFolder(folder.id);
            });

            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);
            folderEl.appendChild(actions);

            // Permitir soltar un personaje arrastrado sobre la carpeta
            folderEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                folderEl.classList.add('drag-over');
            });
            folderEl.addEventListener('dragleave', () => {
                folderEl.classList.remove('drag-over');
            });
            folderEl.addEventListener('drop', (e) => {
                e.preventDefault();
                folderEl.classList.remove('drag-over');
                const characterId = e.dataTransfer.getData('text/character-id');
                if (characterId) assignCharacterToFolderDirect(characterId, folder.id);
            });
        }

        folderContainer.appendChild(folderEl);
    });
}

// ---------- Círculos de personajes ----------

function renderCharacterCircles() {
    characterCircleContainer.innerHTML = '';

    const visibleCharacters = characters
        .filter(c => (c.folder_id || null) === currentFolderId)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const isOwnLibrary = currentUser && viewingUserId === currentUser.id;

    if (visibleCharacters.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = currentFolderId
            ? 'Esta carpeta no tiene personajes todavía. Arrastra uno aquí o crea uno nuevo.'
            : 'No hay personajes. ¡Crea uno nuevo!';
        characterCircleContainer.appendChild(emptyMessage);
        return;
    }

    visibleCharacters.forEach(character => {
        const circle = document.createElement('div');
        circle.className = 'character-circle';

        const circleImage = document.createElement('div');
        circleImage.className = 'circle-image';

        const img = document.createElement('img');
        img.src = character.image || '/api/placeholder/150/150';
        img.alt = character.name;

        const circleName = document.createElement('div');
        circleName.className = 'circle-name';
        circleName.textContent = character.name;

        circleImage.appendChild(img);
        circle.appendChild(circleImage);
        circle.appendChild(circleName);

        circle.addEventListener('click', () => openBook(character.id));

        if (isOwnLibrary) {
            circle.draggable = true;
            circle.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/character-id', character.id);
                circle.classList.add('dragging');
            });
            circle.addEventListener('dragend', () => circle.classList.remove('dragging'));

            // Soltar un personaje sobre otro reordena ambos en el mismo lugar (misma carpeta o raíz)
            circle.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                circle.classList.add('drop-target');
            });
            circle.addEventListener('dragleave', () => {
                circle.classList.remove('drop-target');
            });
            circle.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                circle.classList.remove('drop-target');
                const draggedId = e.dataTransfer.getData('text/character-id');
                if (draggedId && draggedId !== character.id) {
                    reorderCharacters(draggedId, character.id);
                }
            });

            const moveBtn = document.createElement('button');
            moveBtn.className = 'circle-move-btn';
            moveBtn.title = 'Mover a carpeta';
            moveBtn.innerHTML = '<i class="fas fa-folder-open"></i>';
            moveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showMoveToFolderDialog(character.id);
            });
            circle.appendChild(moveBtn);
        }

        characterCircleContainer.appendChild(circle);
    });
}

// ---------- Reordenar personajes (arrastrar y soltar sobre otro) ----------

async function reorderCharacters(draggedId, targetId) {
    if (!currentUser || viewingUserId !== currentUser.id) return;

    const draggedCharacter = characters.find(c => c.id === draggedId);
    const targetCharacter = characters.find(c => c.id === targetId);
    if (!draggedCharacter || !targetCharacter) return;

    // Solo reordena si ambos están en el mismo lugar (misma carpeta, o ambos en la raíz)
    const folderId = targetCharacter.folder_id || null;
    if ((draggedCharacter.folder_id || null) !== folderId) return;

    const scoped = characters
        .filter(c => (c.folder_id || null) === folderId)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const fromIndex = scoped.findIndex(c => c.id === draggedId);
    const toIndex = scoped.findIndex(c => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    scoped.splice(toIndex, 0, scoped.splice(fromIndex, 1)[0]);
    scoped.forEach((c, index) => { c.order_index = index; });

    renderCharacterCircles();

    try {
        const results = await Promise.all(
            scoped.map(c =>
                supabaseClient
                    .from('characters')
                    .update({ order_index: c.order_index })
                    .eq('id', c.id)
                    .eq('user_id', currentUser.id)
            )
        );

        const failed = results.find(r => r.error);
        if (failed) throw failed.error;
    } catch (error) {
        showNotification(`Error al guardar el orden: ${error.message}`, 'error');
    }
}