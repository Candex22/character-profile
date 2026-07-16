document.addEventListener('DOMContentLoaded', () => {
    renderCharacterCircles();
    setupEventListeners();
    setupLightbox();
    showPage(1);
});

function setupEventListeners() {
    // Navegación del libro
    prevPageBtn.addEventListener('click', prevPage);
    nextPageBtn.addEventListener('click', nextPage);
    closeBookBtn.addEventListener('click', closeBook);

    // Edición de personaje
    editCharacterBtn.addEventListener('click', toggleEditMode);
    saveCharacterBtn.addEventListener('click', saveCharacter);
    deleteCharacterBtn.addEventListener('click', deleteCharacter);

    // Añadir personaje
    addCharacterBtn.addEventListener('click', showAddCharacterDialog);
    cancelAddCharacterBtn.addEventListener('click', hideAddCharacterDialog);
    newCharacterForm.addEventListener('submit', addNewCharacter);

    // Vista previa de imágenes
    newCharacterImageInput.addEventListener('change', (e) => {
        previewImage(e.target, newCharacterImagePreview);
    });

    relationImageInput.addEventListener('change', (e) => {
        previewImage(e.target, relationImagePreview);
    });

    characterImageUpload.addEventListener('change', (e) => {
        previewImage(e.target, characterMainImage);
        updateCharacterImage(e.target.files[0]);
    });

    // Sliders de emociones
    document.querySelectorAll('.emotion-slider').forEach(slider => {
        slider.addEventListener('input', function () {
            const valueDisplay = document.getElementById(`${this.dataset.emotion}-value`);
            if (valueDisplay) valueDisplay.textContent = `${this.value}/10`;
        });
    });

    // Relaciones
    const addRelationBtn = document.getElementById('add-relation-btn');
    if (addRelationBtn) addRelationBtn.addEventListener('click', showAddRelationDialog);
    cancelAddRelationBtn.addEventListener('click', hideAddRelationDialog);
    newRelationForm.addEventListener('submit', addNewRelation);

    // Galería
    addGalleryImageBtn.addEventListener('click', () => galleryImageUpload.click());
    galleryImageUpload.addEventListener('change', addGalleryImage);

    // Vínculos familiares
    const addFamilyBondBtn = document.getElementById('add-family-bond-btn');
    if (addFamilyBondBtn) addFamilyBondBtn.addEventListener('click', showAddFamilyBondDialog);
    cancelAddBondBtn.addEventListener('click', hideAddFamilyBondDialog);
    newFamilyBondForm.addEventListener('submit', addNewFamilyBond);

    // Sliders de personalidad
    document.querySelectorAll('.personality-slider').forEach(slider => {
        slider.addEventListener('input', function () { /* feedback visual si se necesita */ });
    });

    // Carpetas
    addFolderBtn.addEventListener('click', showAddFolderDialog);
    cancelAddFolderBtn.addEventListener('click', hideAddFolderDialog);
    newFolderForm.addEventListener('submit', addNewFolder);
    backToRootBtn.addEventListener('click', () => openFolder(null));
    cancelMoveToFolderBtn.addEventListener('click', hideMoveToFolderDialog);
    moveToFolderForm.addEventListener('submit', moveCharacterToFolder);

    // Permitir soltar un personaje sobre el área raíz para sacarlo de su carpeta
    characterCircleContainer.addEventListener('dragover', (e) => {
        if (currentFolderId !== null) e.preventDefault();
    });
    characterCircleContainer.addEventListener('drop', (e) => {
        if (currentFolderId !== null) return;
        e.preventDefault();
        const characterId = e.dataTransfer.getData('text/character-id');
        if (characterId) assignCharacterToFolderDirect(characterId, null);
    });
}