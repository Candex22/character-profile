// Almacenamiento de personajes
let characters = [];
let currentCharacterId = null;
let currentPage = 1;
const totalPages = 5; // Actualizado a 5 páginas
let editMode = false;

// Elementos del DOM
const characterCircleContainer = document.getElementById('character-circle-container');
const bookContainer = document.getElementById('book-container');
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const page3 = document.getElementById('page-3');
const page4 = document.getElementById('page-4');
const page5 = document.getElementById('page-5');
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
    setupLightbox();
});

// Configurar lightbox para imágenes
function setupLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    
    // Cerrar lightbox al hacer clic en el botón de cerrar
    lightboxClose.addEventListener('click', closeLightbox);
    
    // Cerrar lightbox al hacer clic fuera de la imagen
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Cerrar lightbox con la tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}

// Abrir lightbox con una imagen
function openLightbox(imageSrc) {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    
    lightboxImage.src = imageSrc;
    lightbox.classList.add('active');
}

// Cerrar lightbox
function closeLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    lightbox.classList.remove('active');
}

// Renderizar círculos de personajes
function renderCharacterCircles() {
    characterCircleContainer.innerHTML = '';
    
    if (characters.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No hay personajes. ¡Crea uno nuevo!';
        characterCircleContainer.appendChild(emptyMessage);
        return;
    }
    
    characters.forEach(character => {
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
        
        // Evento para abrir el libro de este personaje
        circle.addEventListener('click', () => openBook(character.id));
        
        characterCircleContainer.appendChild(circle);
    });
}

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

     const emotionSliders = document.querySelectorAll('.emotion-slider');
    emotionSliders.forEach(slider => {
        slider.addEventListener('input', function() {
            const emotion = this.dataset.emotion;
            const value = this.value;
            const valueDisplay = document.getElementById(`${emotion}-value`);
            if (valueDisplay) {
                valueDisplay.textContent = `${value}/10`;
            }
        });
    });
    
    // Relaciones
    if (document.getElementById('add-relation-btn')) {
        document.getElementById('add-relation-btn').addEventListener('click', showAddRelationDialog);
    }
    cancelAddRelationBtn.addEventListener('click', hideAddRelationDialog);
    newRelationForm.addEventListener('submit', addNewRelation);
    
    // Galería
    addGalleryImageBtn.addEventListener('click', () => galleryImageUpload.click());
    galleryImageUpload.addEventListener('change', addGalleryImage);
    
    // Event listeners para sliders de personalidad
    setupPersonalitySliders();
}

// Configurar sliders de personalidad
function setupPersonalitySliders() {
    const sliders = document.querySelectorAll('.personality-slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', function() {
            // Actualizar visualmente si es necesario
            updateSliderVisual(this);
        });
    });
}

// Actualizar visual del slider (opcional)
function updateSliderVisual(slider) {
    const value = slider.value;
    // Puedes agregar lógica adicional aquí para feedback visual
}

// Funciones de navegación del libro
function showPage(pageNumber) {
    // Ocultar todas las páginas
    [page1, page2, page3, page4, page5].forEach(page => {
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

// Actualización de la función openBook para manejar los controles de edición según el propietario
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
        
        // Mostrar u ocultar opciones de edición según si es el propietario
        const isOwner = currentUser && currentUser.id === character.user_id;
        editCharacterBtn.classList.toggle('hidden', !isOwner);
        deleteCharacterBtn.classList.toggle('hidden', !isOwner);
    }
}

function closeBook() {
    bookContainer.classList.add('hidden');
    currentCharacterId = null;
}

// Renderizar círculos de personajes
async function loadCharacters() {
    try {
        if (!viewingUserId) return;
        
        const { data, error } = await supabaseClient
            .from('characters')
            .select('*')
            .eq('user_id', viewingUserId);
            
        if (error) throw error;
        
        characters = data || [];
        renderCharacterCircles();
    } catch (error) {
        showNotification(`Error al cargar personajes: ${error.message}`, 'error');
    }
}

// Llenar datos del personaje en el libro
function fillCharacterData(character) {
    // Página 1: Información básica
    document.getElementById('character-name').textContent = character.name;
    
    const mainImage = document.getElementById('character-main-image');
    mainImage.src = character.image || '/api/placeholder/200/200';
    mainImage.classList.add('clickable-image');
    
    // Agregar evento de click para abrir en lightbox (remover eventos previos)
    const newMainImage = mainImage.cloneNode(true);
    mainImage.parentNode.replaceChild(newMainImage, mainImage);
    newMainImage.addEventListener('click', () => {
        if (!editMode && newMainImage.src) {
            openLightbox(newMainImage.src);
        }
    });
    
    document.getElementById('character-age').textContent = character.age || '—';
    document.getElementById('character-birthday').textContent = character.birthday || 'DD/MM/YYYY';
    document.getElementById('character-occupation').textContent = character.occupation || '—';
    document.getElementById('character-race').textContent = character.race || '—';
    document.getElementById('character-origin').textContent = character.origin || '—';
    document.getElementById('character-location').textContent = character.location || '—';

    // Apariencia física
    document.getElementById('character-face').textContent = character.face || '—';
    document.getElementById('character-height').textContent = character.height || '—cm';
    document.getElementById('character-weight').textContent = character.weight || '—kg';
    document.getElementById('character-hair-color').textContent = character.hair_color || '—';
    document.getElementById('character-hair-style').textContent = character.hair_style || '—';
    document.getElementById('character-facial-decorations').textContent = character.facial_decorations || '—';
    document.getElementById('character-skin').textContent = character.skin || '—';
    document.getElementById('character-scars').textContent = character.scars || '—';
    document.getElementById('character-tattoos').textContent = character.tattoos || '—';
    document.getElementById('character-piercings').textContent = character.piercings || '—';
    document.getElementById('character-birthmarks').textContent = character.birthmarks || '—';

    // Voz
    document.getElementById('character-voice').textContent = character.voice || '—';
    document.getElementById('character-speaking-style').textContent = character.speaking_style || '—';
    document.getElementById('character-speaking-rhythm').textContent = character.speaking_rhythm || '—';
    document.getElementById('character-speaking-tempo').textContent = character.speaking_tempo || '—';
    document.getElementById('character-pronunciation').textContent = character.pronunciation || '—';
    document.getElementById('character-accent').textContent = character.accent || '—';
    
    // Página 2: Nueva sección de Personalidad
    // Impresión general - Temperamento
    document.getElementById('temperament-1').textContent = character.temperament_1 || '—';
    document.getElementById('temperament-2').textContent = character.temperament_2 || '—';
    document.getElementById('temperament-3').textContent = character.temperament_3 || '—';
    
    // Presencia
    document.getElementById('presence-text').textContent = character.presence || 'Cómo se siente su presencia. Energía, ritmo y sensación que deja.';
    
    // Primera impresión social
    document.getElementById('first-impression-text').textContent = character.first_impression || 'Qué se prejuzga sin conocerlo.';
    
    // Núcleo interno - Necesidad primaria
    document.getElementById('primary-need').textContent = character.primary_need || 'Aquello que necesita para sentirse completo (Ej.: Pertenecer / Control).';
    
    // Creencia raíz
    document.getElementById('root-belief').textContent = character.root_belief || 'Ej.: “Si no soy útil, no valgo.” / “El afecto siempre tiene un costo.”';
    
    // Impulso automático
    document.getElementById('automatic-impulse').textContent = character.automatic_impulse || 'Reacción instintiva ante la amenaza.';
    
    // Conflicto interno
    document.getElementById('conflict-force-a').textContent = character.conflict_force_a || 'Ej.: Desea cercanía';
    document.getElementById('conflict-force-b').textContent = character.conflict_force_b || 'Ej.: Teme depender';
    // Mayor temor (NUEVO)
    document.getElementById('greatest-fear').textContent = character.greatest_fear || 'Ser abandonado';
    
    // ESPECTRO EMOCIONAL (NUEVO - reemplaza la sección anterior si existía)
    // Cargar intensidad de emociones
    document.getElementById('emotion-anger').value = character.emotion_anger || 5;
    document.getElementById('emotion-joy').value = character.emotion_joy || 5;
    document.getElementById('emotion-fear').value = character.emotion_fear || 5;
    document.getElementById('emotion-sadness').value = character.emotion_sadness || 5;
    document.getElementById('emotion-surprise').value = character.emotion_surprise || 5;
    document.getElementById('emotion-disgust').value = character.emotion_disgust || 5;
    
    // Actualizar valores mostrados
    document.getElementById('anger-value').textContent = `${character.emotion_anger || 5}/10`;
    document.getElementById('joy-value').textContent = `${character.emotion_joy || 5}/10`;
    document.getElementById('fear-value').textContent = `${character.emotion_fear || 5}/10`;
    document.getElementById('sadness-value').textContent = `${character.emotion_sadness || 5}/10`;
    document.getElementById('surprise-value').textContent = `${character.emotion_surprise || 5}/10`;
    document.getElementById('disgust-value').textContent = `${character.emotion_disgust || 5}/10`;
    
    // Cargar expresiones de emociones
    document.getElementById('anger-expression').textContent = character.anger_expression || 'Sarcasmo cortante';
    document.getElementById('joy-expression').textContent = character.joy_expression || 'Sonrisa contenida';
    document.getElementById('fear-expression').textContent = character.fear_expression || 'Hiperactividad, necesidad de control';
    document.getElementById('sadness-expression').textContent = character.sadness_expression || 'Silencio, aislamiento';
    document.getElementById('surprise-expression').textContent = character.surprise_expression || 'Ligera elevación de cejas';
    document.getElementById('disgust-expression').textContent = character.disgust_expression || 'Mueca sutil';
    
    // GATILLOS EMOCIONALES (NUEVO - versión simplificada)
    document.getElementById('trigger-red').textContent = character.trigger_red || 'Que lo subestimen, perder el control';
    document.getElementById('trigger-yellow').textContent = character.trigger_yellow || 'Silencios prolongados, preguntas sobre su pasado';
    document.getElementById('trigger-green').textContent = character.trigger_green || 'Rutinas predecibles, que le pidan consejo';
    
    // CAPAS DE PERSONALIDAD (probablemente ya existe, pero por las dudas)
    document.getElementById('layer-public-text').textContent = character.layer_public || 'Cómo se presenta al mundo';
    document.getElementById('layer-private-text').textContent = character.layer_private || 'Cómo es con quienes confía';
    document.getElementById('layer-alone-text').textContent = character.layer_alone || 'Cómo es cuando nadie lo ve';

    // Página 3: Rasgos de Personalidad - cargar valores de los sliders
    if (character.personality) {
        const personality = typeof character.personality === 'string' 
            ? JSON.parse(character.personality) 
            : character.personality;
        
        Object.keys(personality).forEach(trait => {
            const slider = document.querySelector(`[data-trait="${trait}"]`);
            if (slider) {
                slider.value = personality[trait];
            }
        });
    } else {
        // Valores por defecto (50 = centro)
        document.querySelectorAll('.personality-slider').forEach(slider => {
            slider.value = 50;
        });
    }
    
    // Página 4: Historia
    document.getElementById('character-story').textContent = character.story || 'La historia del personaje aparecerá aquí...';
    
    // Página 5: Galería
    renderGallery(character.gallery || []);
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
        img.classList.add('clickable-image');
        
        // Agregar evento de click para abrir en lightbox
        img.addEventListener('click', (e) => {
            if (!editMode) {
                openLightbox(img.src);
            }
        });
        
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
    // Verificamos que el usuario esté autenticado y sea el propietario del personaje que está viendo
    if (!currentUser) {
        showNotification('Debes iniciar sesión para editar este personaje', 'error');
        return;
    }
    
    // Buscar el personaje actual
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    
    // Verificar que el usuario actual sea el propietario del personaje
    if (character.user_id !== currentUser.id) {
        showNotification('Solo puedes editar tus propios personajes', 'error');
        return;
    }
    
    setEditMode(!editMode);
}

function setEditMode(enabled) {
    editMode = enabled;
    
    // Mostrar/ocultar botones según el modo
    editCharacterBtn.classList.toggle('hidden', enabled);
    saveCharacterBtn.classList.toggle('hidden', !enabled);
    addGalleryImageBtn.classList.toggle('hidden', !enabled);
    imageUploadOverlay.classList.toggle('hidden', !enabled);
    
    // Hacer campos editables
    const editables = document.querySelectorAll('.editable');
    editables.forEach(el => {
        el.contentEditable = enabled;
        
        if (enabled) {
            // Configurar eventos para limpiar placeholders automáticamente
            setupPlaceholderClear(el);
        } else {
            // Remover eventos cuando se desactiva el modo de edición
            el.removeEventListener('focus', handlePlaceholderFocus);
            el.removeEventListener('blur', handlePlaceholderBlur);
        }
    });
    
    // Habilitar/deshabilitar sliders de personalidad
    const sliders = document.querySelectorAll('.personality-slider');
    sliders.forEach(slider => {
        slider.disabled = !enabled;
    });
    
    // Re-renderizar galería para mostrar/ocultar botones de eliminación
    const character = characters.find(c => c.id === currentCharacterId);
    if (character) {
        renderGallery(character.gallery || []);
    }
}

// Lista de valores que se consideran placeholders
const placeholderValues = [
    '—',
    'DD/MM/YYYY',
    '—cm',
    '—kg',
    'La historia del personaje aparecerá aquí...',
    'Cómo se siente su presencia. Energía, ritmo y sensación que deja.',
    'Qué se prejuzga sin conocerlo.',
    'Aquello que necesita para sentirse completo (Ej.: Pertenecer / Control).',
    'Ej.: "Si no soy útil, no valgo." / "El afecto siempre tiene un costo."',
    'Reacción instintiva ante la amenaza.',
    'Ej.: Desea cercanía',
    'Ej.: Teme depender',
    'Ser abandonado',
    'Sarcasmo cortante',
    'Sonrisa contenida',
    'Hiperactividad, necesidad de control',
    'Silencio, aislamiento',
    'Ligera elevación de cejas',
    'Mueca sutil',
    'Que lo subestimen, perder el control',
    'Silencios prolongados, preguntas sobre su pasado',
    'Rutinas predecibles, que le pidan consejo',
    'Cómo se presenta al mundo',
    'Cómo es con quienes confía',
    'Cómo es cuando nadie lo ve'
];

// Configurar limpieza automática de placeholders
function setupPlaceholderClear(element) {
    element.addEventListener('focus', handlePlaceholderFocus);
    element.addEventListener('blur', handlePlaceholderBlur);
}

// Manejar el foco en un campo editable
function handlePlaceholderFocus(e) {
    const element = e.target;
    const currentText = element.textContent.trim();
    
    // Si el texto actual es un placeholder, limpiarlo
    if (placeholderValues.includes(currentText)) {
        element.setAttribute('data-placeholder', currentText);
        element.textContent = '';
    }
}

// Manejar la pérdida de foco en un campo editable
function handlePlaceholderBlur(e) {
    const element = e.target;
    const currentText = element.textContent.trim();
    
    // Si el campo quedó vacío, restaurar el placeholder
    if (currentText === '' && element.hasAttribute('data-placeholder')) {
        element.textContent = element.getAttribute('data-placeholder');
        element.removeAttribute('data-placeholder');
    }
}

// Guardar personaje
async function saveCharacter() {
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }
    
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    
    // Actualizar datos del personaje - Información personal
    character.name = document.getElementById('character-name').textContent;
    character.age = document.getElementById('character-age').textContent;
    character.birthday = document.getElementById('character-birthday').textContent;
    character.occupation = document.getElementById('character-occupation').textContent;
    character.race = document.getElementById('character-race').textContent;
    character.origin = document.getElementById('character-origin').textContent;
    character.location = document.getElementById('character-location').textContent;
    
    // Apariencia física
    character.face = document.getElementById('character-face').textContent;
    character.height = document.getElementById('character-height').textContent;
    character.weight = document.getElementById('character-weight').textContent;
    character.hair_color = document.getElementById('character-hair-color').textContent;
    character.hair_style = document.getElementById('character-hair-style').textContent;
    character.facial_decorations = document.getElementById('character-facial-decorations').textContent;
    character.skin = document.getElementById('character-skin').textContent;
    character.scars = document.getElementById('character-scars').textContent;
    character.tattoos = document.getElementById('character-tattoos').textContent;
    character.piercings = document.getElementById('character-piercings').textContent;
    character.birthmarks = document.getElementById('character-birthmarks').textContent;
    
    // Voz
    character.voice = document.getElementById('character-voice').textContent;
    character.speaking_style = document.getElementById('character-speaking-style').textContent;
    character.speaking_rhythm = document.getElementById('character-speaking-rhythm').textContent;
    character.speaking_tempo = document.getElementById('character-speaking-tempo').textContent;
    character.pronunciation = document.getElementById('character-pronunciation').textContent;
    character.accent = document.getElementById('character-accent').textContent;
    
    // Página 2: Nueva sección de Personalidad
    // Impresión general
    character.temperament_1 = document.getElementById('temperament-1').textContent;
    character.temperament_2 = document.getElementById('temperament-2').textContent;
    character.temperament_3 = document.getElementById('temperament-3').textContent;
    character.presence = document.getElementById('presence-text').textContent;
    character.first_impression = document.getElementById('first-impression-text').textContent;
    
    // Núcleo interno
    character.primary_need = document.getElementById('primary-need').textContent;
    character.root_belief = document.getElementById('root-belief').textContent;
    character.automatic_impulse = document.getElementById('automatic-impulse').textContent;
    character.conflict_force_a = document.getElementById('conflict-force-a').textContent;
    character.conflict_force_b = document.getElementById('conflict-force-b').textContent;

    // Mayor temor (NUEVO)
    character.greatest_fear = document.getElementById('greatest-fear').textContent;
    
    // ESPECTRO EMOCIONAL (NUEVO)
    character.emotion_anger = parseInt(document.getElementById('emotion-anger').value);
    character.emotion_joy = parseInt(document.getElementById('emotion-joy').value);
    character.emotion_fear = parseInt(document.getElementById('emotion-fear').value);
    character.emotion_sadness = parseInt(document.getElementById('emotion-sadness').value);
    character.emotion_surprise = parseInt(document.getElementById('emotion-surprise').value);
    character.emotion_disgust = parseInt(document.getElementById('emotion-disgust').value);
    
    character.anger_expression = document.getElementById('anger-expression').textContent;
    character.joy_expression = document.getElementById('joy-expression').textContent;
    character.fear_expression = document.getElementById('fear-expression').textContent;
    character.sadness_expression = document.getElementById('sadness-expression').textContent;
    character.surprise_expression = document.getElementById('surprise-expression').textContent;
    character.disgust_expression = document.getElementById('disgust-expression').textContent;
    
    // GATILLOS EMOCIONALES (NUEVO - versión simplificada)
    character.trigger_red = document.getElementById('trigger-red').textContent;
    character.trigger_yellow = document.getElementById('trigger-yellow').textContent;
    character.trigger_green = document.getElementById('trigger-green').textContent;
    
    // CAPAS DE PERSONALIDAD (probablemente ya existe)
    character.layer_public = document.getElementById('layer-public-text').textContent;
    character.layer_private = document.getElementById('layer-private-text').textContent;
    character.layer_alone = document.getElementById('layer-alone-text').textContent;
    
    // Página 3: Rasgos de Personalidad - guardar valores de los sliders
    const personality = {};
    document.querySelectorAll('.personality-slider').forEach(slider => {
        const trait = slider.getAttribute('data-trait');
        personality[trait] = parseInt(slider.value);
    });
    character.personality = personality;
    
    // Historia
    character.story = document.getElementById('character-story').textContent;
    
    try {
        const { error } = await supabaseClient
            .from('characters')
            .update(character)
            .eq('id', character.id)
            .eq('user_id', currentUser.id);
            
        if (error) throw error;
        
        // Actualizar círculos de personajes
        renderCharacterCircles();
        
        // Desactivar modo de edición
        setEditMode(false);
        
        showNotification('Personaje guardado con éxito');
    } catch (error) {
        showNotification(`Error al guardar: ${error.message}`, 'error');
    }
}

// Eliminar personaje
async function deleteCharacter() {
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para eliminar este personaje', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este personaje? Esta acción no se puede deshacer.')) {
        try {
            const { error } = await supabaseClient
                .from('characters')
                .delete()
                .eq('id', currentCharacterId)
                .eq('user_id', currentUser.id);
                
            if (error) throw error;
            
            // Actualizar lista local
            characters = characters.filter(c => c.id !== currentCharacterId);
            
            closeBook();
            renderCharacterCircles();
            showNotification('Personaje eliminado');
        } catch (error) {
            showNotification(`Error al eliminar: ${error.message}`, 'error');
        }
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

async function updateCharacterImage(file) {
    if (!file || !currentUser || viewingUserId !== currentUser.id) return;
    
    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const base64Image = e.target.result;
            const character = characters.find(c => c.id === currentCharacterId);
            
            if (character) {
                character.image = base64Image;
                
                const { error } = await supabaseClient
                    .from('characters')
                    .update({ image: base64Image })
                    .eq('id', character.id)
                    .eq('user_id', currentUser.id);
                    
                if (error) throw error;
            }
        };
        reader.readAsDataURL(file);
    } catch (error) {
        showNotification(`Error al actualizar imagen: ${error.message}`, 'error');
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

async function addNewCharacter(e) {
    e.preventDefault();
    
    // Verificar que el usuario está autenticado
    if (!currentUser) {
        showNotification('Debes iniciar sesión para crear personajes', 'error');
        return;
    }
    
    const nameInput = document.getElementById('new-character-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        showNotification('Por favor, introduce un nombre para el personaje', 'error');
        return;
    }
    
    try {
        // Crear objeto de personalidad por defecto
        const defaultPersonality = {};
        for (let i = 1; i <= 18; i++) {
            const slider = document.getElementById(`trait-${i}`);
            if (slider) {
                defaultPersonality[slider.getAttribute('data-trait')] = 50;
            }
        }
        
        const newCharacter = {
            user_id: currentUser.id,
            name: name,
            image: newCharacterImagePreview.src === '/api/placeholder/150/150' ? null : newCharacterImagePreview.src,
            personality: JSON.stringify(defaultPersonality),
            gallery: JSON.stringify([])
        };
        
        console.log("Intentando crear personaje:", newCharacter);
        
        const { data, error } = await supabaseClient
            .from('characters')
            .insert([newCharacter])
            .select();
            
        if (error) {
            console.error("Error detallado:", error);
            throw error;
        }
        
        console.log("Personaje creado:", data);
        
        const newCharacterId = data[0].id;
        
        const characterForUI = {
            id: newCharacterId,
            user_id: currentUser.id,
            name: name,
            image: newCharacterImagePreview.src !== '/api/placeholder/150/150' ? newCharacterImagePreview.src : null,
            personality: defaultPersonality,
            gallery: []
        };
        
        characters.push(characterForUI);
        renderCharacterCircles();
        hideAddCharacterDialog();
        openBook(newCharacterId);
        setEditMode(true);
        
        showNotification('Personaje creado con éxito');
    } catch (error) {
        console.error("Error completo:", error);
        showNotification(`Error al crear el personaje: ${error.message}`, 'error');
    }
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

async function addNewRelation(e) {
    e.preventDefault();
    
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }
    
    const nameInput = document.getElementById('relation-name');
    const name = nameInput.value.trim();
    const type = document.getElementById('relation-type').value;
    
    if (!name) {
        showNotification('Por favor, introduce un nombre para la relación', 'error');
        return;
    }
    
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    
    if (!character.relations) {
        character.relations = [];
    }
    
    const newRelation = {
        name: name,
        type: type,
        image: relationImagePreview.src !== '/api/placeholder/100/100' ? relationImagePreview.src : null
    };
    
    try {
        character.relations.push(newRelation);
        
        const { error } = await supabaseClient
            .from('characters')
            .update({ relations: character.relations })
            .eq('id', character.id)
            .eq('user_id', currentUser.id);
            
        if (error) throw error;
        
        hideAddRelationDialog();
        showNotification('Relación añadida');
    } catch (error) {
        character.relations.pop();
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Gestión de galería
async function addGalleryImage(e) {
    const file = e.target.files[0];
    if (!file || !currentUser || viewingUserId !== currentUser.id) return;
    
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    
    if (!character.gallery) {
        character.gallery = [];
    }
    
    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
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

// Notificaciones
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
    
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Inicializar la primera página al cargar
showPage(1);