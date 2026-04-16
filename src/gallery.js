function renderGallery(gallery) {
    const galleryContainer = document.getElementById('character-gallery');
    galleryContainer.innerHTML = '';

    if (gallery.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-placeholder';
        empty.textContent = 'No hay imágenes en la galería.';
        galleryContainer.appendChild(empty);
        return;
    }

    gallery.forEach((image, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = image || '/api/placeholder/180/180';
        img.alt = 'Imagen de galería';
        img.classList.add('clickable-image');

        img.addEventListener('click', () => {
            if (!editMode) openLightbox(img.src);
        });

        galleryItem.appendChild(img);

        if (editMode) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-gallery-item';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeGalleryImage(index);
            });
            galleryItem.appendChild(deleteBtn);
        }

        galleryContainer.appendChild(galleryItem);
    });
}

async function addGalleryImage(e) {
    const file = e.target.files[0];
    if (!file || !currentUser || viewingUserId !== currentUser.id) return;

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    if (!character.gallery) character.gallery = [];

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target.result;
            character.gallery.push(base64Image);

            const { error } = await supabaseClient
                .from('characters')
                .update({ gallery: character.gallery })
                .eq('id', character.id)
                .eq('user_id', currentUser.id);

            if (error) throw error;

            renderGallery(character.gallery);
            galleryImageUpload.value = '';
            showNotification('Imagen añadida a la galería');
        };
        reader.readAsDataURL(file);
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
}

async function removeGalleryImage(index) {
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character || !character.gallery) return;

    try {
        character.gallery.splice(index, 1);

        const { error } = await supabaseClient
            .from('characters')
            .update({ gallery: character.gallery })
            .eq('id', character.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        renderGallery(character.gallery);
        showNotification('Imagen eliminada de la galería');
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
}