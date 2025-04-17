// Almacenamiento de personajes
let characters = JSON.parse(localStorage.getItem('characters')) || [];
let currentCharacterId = null;
let currentPage = 1;
const totalPages = 3;
let editMode = false;

// Elementos del DOM
const characterCircleContainer = document.getElementById('character-circle-container');
const bookContainer = document.getElementById('book-container');
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const page3 = document.getElementById('page-3');
const pageIndicator = document.getElementById('page-indicator');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const closeBookBtn = document.getElementById('close-book');
const editCharacterBtn = document.getElementById('edit-character');
const saveCharacterBtn = document.getElementById('save-character');
const deleteCharacterBtn = document.getElementById('delete-character');
const addCharacterBtn = document.getElementById('add-character-btn');
const addCharacterDialog = document.getElementById('add-character-dialog');
const newCharacterForm = document.getElementById('new-character-form');
const cancelAddCharacterBtn = document.getElementById('cancel-add-character');
const newCharacterImageInput = document.getElementById('new-character-image');
const newCharacterImagePreview = document.getElementById('new-character-image-preview');
const addRelationBtn = document.getElementById('add-relation-btn');
const addRelationDialog = document.getElementById('add-relation-dialog');
const newRelationForm = document.getElementById('new-relation-form');
const cancelAddRelationBtn = document.getElementById('cancel-add-relation');
const relationImageInput = document.getElementById('relation-image');
const relationImagePreview = document.getElementById('relation-image-preview');
const characterImageUpload = document.getElementById('character-image-upload');
const characterMainImage = document.getElementById('character-main-image');
const imageUploadOverlay = document.querySelector('.image-upload-overlay');
const addGalleryImageBtn = document.getElementById('add-gallery-image-btn');
const galleryImageUpload = document.getElementById('gallery-image-upload');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderCharacterCircles();
    setupEventListeners();
});

// Configuración de eventos
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
    
    // Relaciones
    addRelationBtn.addEventListener('click', showAddRelationDialog);
    cancelAddRelationBtn.addEventListener('click', hideAddRelationDialog);
    newRelationForm.addEventListener('submit', addNewRelation);
    
    // Galería
    addGalleryImageBtn.addEventListener('click', () => galleryImageUpload.click());
    galleryImageUpload.addEventListener('change', addGalleryImage);
}

// Funciones de navegación del libro
function showPage(pageNumber) {
    // Ocultar todas las páginas
    [page1, page2, page3].forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostrar la página seleccionada
    const currentPageElement = document.getElementById(`page-${pageNumber}`);
    currentPageElement.classList.add('active');
    
    // Actualizar indicador de página
    pageIndicator.textContent = `Página ${pageNumber} de ${totalPages}`;
    currentPage = pageNumber;
}

function prevPage() {
    if (currentPage > 1) {
        showPage(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        showPage(currentPage + 1);
    }
}

// Abrir y cerrar el libro
function openBook(characterId) {
    currentCharacterId = characterId;
    const character = characters.find(c => c.id === characterId);
    
    if (character) {
        // Rellenar datos del personaje
        fillCharacterData(character);
        
        // Mostrar libro y primera página
        bookContainer.classList.remove('hidden');
        showPage(1);
        
        // Resetear modo de edición
        setEditMode(false);
    }
}

function closeBook() {
    bookContainer.classList.add('hidden');
    currentCharacterId = null;
}

// Renderizar círculos de personajes
function renderCharacterCircles() {
    characterCircleContainer.innerHTML = '';
    
    if (characters.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No hay personajes. ¡Añade uno nuevo!';
        characterCircleContainer.appendChild(emptyMessage);
        return;
    }
    
    characters.forEach(character => {
        const characterCircle = document.createElement('div');
        characterCircle.className = 'character-circle';
        characterCircle.dataset.characterId = character.id;
        
        const img = document.createElement('img');
        img.src = character.image || '/api/placeholder/150/150';
        img.alt = character.name;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'character-name';
        nameDiv.textContent = character.name;
        
        characterCircle.appendChild(img);
        characterCircle.appendChild(nameDiv);
        
        characterCircle.addEventListener('click', () => {
            openBook(character.id);
        });
        
        characterCircleContainer.appendChild(characterCircle);
    });
}

// Llenar datos del personaje en el libro
function fillCharacterData(character) {
    // Página 1: Información básica
    document.getElementById('character-name').textContent = character.name;
    document.getElementById('character-main-image').src = character.image || '/api/placeholder/200/200';
    document.getElementById('character-age').textContent = character.age || '??';
    document.getElementById('character-birthday').textContent = character.birthday || '??/??';
    document.getElementById('character-height').textContent = character.height || '???cm';
    document.getElementById('character-occupation').textContent = character.occupation || '???';
    document.getElementById('character-goals').textContent = character.goals || 'Los objetivos del personaje aparecerán aquí...';
    document.getElementById('character-skills').textContent = character.skills || 'Habilidades del personaje...';
    document.getElementById('character-extra').textContent = character.extra || 'Información adicional...';
    document.getElementById('character-race').textContent = character.race || '???';
    document.getElementById('character-location').textContent = character.location || '???';

    // Relaciones
    renderRelations(character.relations || []);
    
    // Página 2: Historia
    document.getElementById('character-story').textContent = character.story || 'La historia del personaje aparecerá aquí...';
    
    // Página 3: Galería
    renderGallery(character.gallery || []);
}

// Renderizar relaciones
function renderRelations(relations) {
    const relationsContainer = document.getElementById('character-relations');
    relationsContainer.innerHTML = '';
    
    if (relations.length === 0) {
        const emptyRelations = document.createElement('p');
        emptyRelations.className = 'empty-placeholder';
        emptyRelations.textContent = 'No hay relaciones.';
        relationsContainer.appendChild(emptyRelations);
        return;
    }
    
    relations.forEach((relation, index) => {
        const relationItem = document.createElement('div');
        relationItem.className = 'relation-item';
        relationItem.dataset.index = index;
        
        const relationImage = document.createElement('div');
        relationImage.className = 'relation-image';
        
        const img = document.createElement('img');
        img.src = relation.image || '/api/placeholder/70/70';
        img.alt = relation.name;
        
        const relationName = document.createElement('div');
        relationName.className = 'relation-name';
        relationName.textContent = relation.name;
        
        const relationType = document.createElement('div');
        relationType.className = 'relation-type';
        relationType.textContent = getRelationTypeText(relation.type);
        
        relationImage.appendChild(img);
        relationItem.appendChild(relationImage);
        relationItem.appendChild(relationName);
        relationItem.appendChild(relationType);
        
        // En modo edición, agregar botón para eliminar
        if (editMode) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-relation';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeRelation(index);
            });
            relationItem.appendChild(deleteBtn);
        }
        
        relationsContainer.appendChild(relationItem);
    });
}

function getRelationTypeText(type) {
    const types = {
        'mother': 'Madre',
        'father': 'Padre',
        'brother': 'Hermano',
        'sister': 'Hermana',
        'partner': 'Pareja',
        'friend': 'Amistad',
        'other': 'Otro'
    };
    return types[type] || 'Otro';
}

// Renderizar galería
function renderGallery(gallery) {
    const galleryContainer = document.getElementById('character-gallery');
    galleryContainer.innerHTML = '';
    
    if (gallery.length === 0) {
        const emptyGallery = document.createElement('p');
        emptyGallery.className = 'empty-placeholder';
        emptyGallery.textContent = 'No hay imágenes en la galería.';
        galleryContainer.appendChild(emptyGallery);
        return;
    }
    
    gallery.forEach((image, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = image || '/api/placeholder/180/180';
        img.alt = 'Imagen de galería';
        
        galleryItem.appendChild(img);
        
        // En modo edición, agregar botón para eliminar
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

// Modo de edición
function toggleEditMode() {
    setEditMode(!editMode);
}

function setEditMode(enabled) {
    editMode = enabled;
    
    // Mostrar/ocultar botones según el modo
    editCharacterBtn.classList.toggle('hidden', enabled);
    saveCharacterBtn.classList.toggle('hidden', !enabled);
    addRelationBtn.classList.toggle('hidden', !enabled);
    addGalleryImageBtn.classList.toggle('hidden', !enabled);
    imageUploadOverlay.classList.toggle('hidden', !enabled);
    
    // Hacer campos editables
    const editables = document.querySelectorAll('.editable');
    editables.forEach(el => {
        el.contentEditable = enabled;
    });
    
    // Re-renderizar relaciones y galería para mostrar/ocultar botones de eliminación
    const character = characters.find(c => c.id === currentCharacterId);
    if (character) {
        renderRelations(character.relations || []);
        renderGallery(character.gallery || []);
    }
}

// Guardar personaje
function saveCharacter() {
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    
    // Actualizar datos del personaje
    character.name = document.getElementById('character-name').textContent;
    character.age = document.getElementById('character-age').textContent;
    character.birthday = document.getElementById('character-birthday').textContent;
    character.height = document.getElementById('character-height').textContent;
    character.occupation = document.getElementById('character-occupation').textContent;
    character.goals = document.getElementById('character-goals').textContent;
    character.skills = document.getElementById('character-skills').textContent;
    character.extra = document.getElementById('character-extra').textContent;
    character.story = document.getElementById('character-story').textContent;
    character.race = document.getElementById('character-race').textContent;
    character.location = document.getElementById('character-location').textContent;
    
    // Guardar en almacenamiento local
    localStorage.setItem('characters', JSON.stringify(characters));
    
    // Actualizar círculos de personajes
    renderCharacterCircles();
    
    // Desactivar modo de edición
    setEditMode(false);
    
    // Mostrar notificación
    showNotification('Personaje guardado con éxito');
}

// Eliminar personaje
function deleteCharacter() {
    if (confirm('¿Estás seguro de que quieres eliminar este personaje? Esta acción no se puede deshacer.')) {
        characters = characters.filter(c => c.id !== currentCharacterId);
        localStorage.setItem('characters', JSON.stringify(characters));
        closeBook();
        renderCharacterCircles();
        showNotification('Personaje eliminado');
    }
}

// Gestión de imágenes
function previewImage(input, imgElement) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updateCharacterImage(file) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const character = characters.find(c => c.id === currentCharacterId);
            if (character) {
                character.image = e.target.result;
                localStorage.setItem('characters', JSON.stringify(characters));
            }
        };
        reader.readAsDataURL(file);
    }
}

// Añadir personaje
function showAddCharacterDialog() {
    addCharacterDialog.classList.remove('hidden');
    document.getElementById('new-character-name').value = '';
    newCharacterImagePreview.src = '/api/placeholder/150/150';
}

function hideAddCharacterDialog() {
    addCharacterDialog.classList.add('hidden');
}

function addNewCharacter(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('new-character-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Por favor, introduce un nombre para el personaje.');
        return;
    }
    
    // Crear nuevo personaje
    const newCharacter = {
        id: Date.now().toString(),
        name: name,
        image: newCharacterImagePreview.src !== '/api/placeholder/150/150' ? newCharacterImagePreview.src : null,
        relations: [],
        gallery: []
    };
    
    // Añadir a la lista de personajes
    characters.push(newCharacter);
    localStorage.setItem('characters', JSON.stringify(characters));
    
    // Actualizar UI
    renderCharacterCircles();
    hideAddCharacterDialog();
    
    // Abrir el libro del nuevo personaje
    openBook(newCharacter.id);
    
    // Activar modo de edición
    setEditMode(true);
}

// Gestión de relaciones
function showAddRelationDialog() {
    addRelationDialog.classList.remove('hidden');
    document.getElementById('relation-name').value = '';
    document.getElementById('relation-type').value = 'mother';
    relationImagePreview.src = '/api/placeholder/100/100';
}

function hideAddRelationDialog() {
    addRelationDialog.classList.add('hidden');
}

function addNewRelation(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('relation-name');
    const name = nameInput.value.trim();
    const type = document.getElementById('relation-type').value;
    
    if (!name) {
        alert('Por favor, introduce un nombre para la relación.');
        return;
    }
    
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    
    // Inicializar el array de relaciones si no existe
    if (!character.relations) {
        character.relations = [];
    }
    
    // Crear nueva relación
    const newRelation = {
        name: name,
        type: type,
        image: relationImagePreview.src !== '/api/placeholder/100/100' ? relationImagePreview.src : null
    };
    
    // Añadir a la lista de relaciones
    character.relations.push(newRelation);
    localStorage.setItem('characters', JSON.stringify(characters));
    
    // Actualizar UI
    renderRelations(character.relations);
    hideAddRelationDialog();
}

function removeRelation(index) {
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character || !character.relations) return;
    
    character.relations.splice(index, 1);
    localStorage.setItem('characters', JSON.stringify(characters));
    renderRelations(character.relations);
}

// Gestión de galería
function addGalleryImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    
    // Inicializar la galería si no existe
    if (!character.gallery) {
        character.gallery = [];
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        character.gallery.push(e.target.result);
        localStorage.setItem('characters', JSON.stringify(characters));
        renderGallery(character.gallery);
        
        // Resetear el input
        galleryImageUpload.value = '';
    };
    reader.readAsDataURL(file);
}

function removeGalleryImage(index) {
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character || !character.gallery) return;
    
    character.gallery.splice(index, 1);
    localStorage.setItem('characters', JSON.stringify(characters));
    renderGallery(character.gallery);
}

// Notificaciones
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Estilos inline para la notificación
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'var(--primary-color)';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Animar
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Inicializar la primera página al cargar
showPage(1);
