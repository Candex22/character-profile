// ---------- Navegación de páginas ----------

function showPage(pageNumber) {
    [page1, page2, page3, page4, page5, page6, page7].forEach(page => {
        page.classList.remove('active');
    });

    document.getElementById(`page-${pageNumber}`).classList.add('active');
    pageIndicator.textContent = `Página ${pageNumber} de ${totalPages}`;
    currentPage = pageNumber;
}

function prevPage() {
    if (currentPage > 1) showPage(currentPage - 1);
}

function nextPage() {
    if (currentPage < totalPages) showPage(currentPage + 1);
}

// ---------- Abrir / cerrar libro ----------

function openBook(characterId) {
    currentCharacterId = characterId;
    const character = characters.find(c => c.id === characterId);

    if (character) {
        fillCharacterData(character);
        bookContainer.classList.remove('hidden');
        showPage(1);
        setEditMode(false);

        const isOwner = currentUser && currentUser.id === character.user_id;
        editCharacterBtn.classList.toggle('hidden', !isOwner);
        deleteCharacterBtn.classList.toggle('hidden', !isOwner);
    }
}

function closeBook() {
    bookContainer.classList.add('hidden');
    currentCharacterId = null;
}

// ---------- Llenado de datos ----------

function fillCharacterData(character) {
    // Página 1: Información básica
    document.getElementById('character-name').textContent = character.name;

    const mainImage = document.getElementById('character-main-image');
    mainImage.src = character.image || '/api/placeholder/200/200';
    mainImage.classList.add('clickable-image');

    const newMainImage = mainImage.cloneNode(true);
    mainImage.parentNode.replaceChild(newMainImage, mainImage);
    newMainImage.addEventListener('click', () => {
        if (!editMode && newMainImage.src) openLightbox(newMainImage.src);
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

    // Página 2: Personalidad — Núcleo interno
    document.getElementById('primary-need').textContent = character.primary_need || 'Aquello que necesita para sentirse completo (Ej.: Pertenecer / Control).';
    document.getElementById('root-belief').textContent = character.root_belief || 'Ej.: "Si no soy útil, no valgo." / "El afecto siempre tiene un costo."';
    document.getElementById('greatest-fear').textContent = character.greatest_fear || 'Ser abandonado';
    document.getElementById('character-priorities').textContent = character.priorities || 'Ej.: Familia, libertad, reconocimiento';

    // Espectro emocional
    const emotions = ['anger', 'joy', 'fear', 'sadness', 'surprise', 'disgust'];
    emotions.forEach(e => {
        document.getElementById(`emotion-${e}`).value = character[`emotion_${e}`] || 5;
        document.getElementById(`${e}-value`).textContent = `${character[`emotion_${e}`] || 5}/10`;
        document.getElementById(`${e}-expression`).textContent = character[`${e}_expression`] || '—';
    });

    // Gatillos emocionales
    document.getElementById('trigger-red').textContent = character.trigger_red || 'Que lo subestimen, perder el control';
    document.getElementById('trigger-yellow').textContent = character.trigger_yellow || 'Silencios prolongados, preguntas sobre su pasado';
    document.getElementById('trigger-green').textContent = character.trigger_green || 'Rutinas predecibles, que le pidan consejo';

    // Página 3: Rasgos (sliders)
    if (character.personality) {
        const personality = typeof character.personality === 'string'
            ? JSON.parse(character.personality)
            : character.personality;
        Object.keys(personality).forEach(trait => {
            const slider = document.querySelector(`[data-trait="${trait}"]`);
            if (slider) slider.value = personality[trait];
        });
    } else {
        document.querySelectorAll('.personality-slider').forEach(s => { s.value = 50; });
    }

    // Página 4: Vínculos familiares
    document.getElementById('family-climate').textContent = character.family_climate || '—';
    document.getElementById('family-disappointment').textContent = character.family_disappointment || '—';
    document.getElementById('family-pride').textContent = character.family_pride || '—';

    const familyBonds = character.family_bonds
        ? (typeof character.family_bonds === 'string' ? JSON.parse(character.family_bonds) : character.family_bonds)
        : [];
    renderFamilyBonds(familyBonds);

    // Página 5: Habilidades
    fillSkills(character);

    // Página 6: Historia y galería
    document.getElementById('character-story').textContent = character.story || 'La historia del personaje aparecerá aquí...';
    renderGallery(character.gallery || []);
}

// ---------- Modo edición ----------

// Lista de textos considerados placeholders
const placeholderValues = [
    '—', 'DD/MM/YYYY', '—cm', '—kg',
    'La historia del personaje aparecerá aquí...',
    'Aquello que necesita para sentirse completo (Ej.: Pertenecer / Control).',
    'Ej.: "Si no soy útil, no valgo." / "El afecto siempre tiene un costo."',
    'Ser abandonado',
    'Ej.: Familia, libertad, reconocimiento',
    'Sarcasmo cortante', 'Sonrisa contenida', 'Hiperactividad, necesidad de control',
    'Silencio, aislamiento', 'Ligera elevación de cejas', 'Mueca sutil',
    'Que lo subestimen, perder el control',
    'Silencios prolongados, preguntas sobre su pasado',
    'Rutinas predecibles, que le pidan consejo'
];

function setupPlaceholderClear(element) {
    element.addEventListener('focus', handlePlaceholderFocus);
    element.addEventListener('blur', handlePlaceholderBlur);
}

function handlePlaceholderFocus(e) {
    const el = e.target;
    if (placeholderValues.includes(el.textContent.trim())) {
        el.setAttribute('data-placeholder', el.textContent);
        el.textContent = '';
    }
}

function handlePlaceholderBlur(e) {
    const el = e.target;
    if (el.textContent.trim() === '' && el.hasAttribute('data-placeholder')) {
        el.textContent = el.getAttribute('data-placeholder');
        el.removeAttribute('data-placeholder');
    }
}

function toggleEditMode() {
    if (!currentUser) {
        showNotification('Debes iniciar sesión para editar este personaje', 'error');
        return;
    }
    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    if (character.user_id !== currentUser.id) {
        showNotification('Solo puedes editar tus propios personajes', 'error');
        return;
    }
    setEditMode(!editMode);
}

function setEditMode(enabled) {
    editMode = enabled;

    editCharacterBtn.classList.toggle('hidden', enabled);
    saveCharacterBtn.classList.toggle('hidden', !enabled);
    addGalleryImageBtn.classList.toggle('hidden', !enabled);
    imageUploadOverlay.classList.toggle('hidden', !enabled);

    const addFamilyBondBtn = document.getElementById('add-family-bond-btn');
    if (addFamilyBondBtn) addFamilyBondBtn.classList.toggle('hidden', !enabled);

    document.querySelectorAll('.editable').forEach(el => {
        el.contentEditable = enabled;
        if (enabled) {
            setupPlaceholderClear(el);
        } else {
            el.removeEventListener('focus', handlePlaceholderFocus);
            el.removeEventListener('blur', handlePlaceholderBlur);
        }
    });

    document.querySelectorAll('.personality-slider').forEach(s => { s.disabled = !enabled; });

    setSkillsEditMode(enabled);

    const character = characters.find(c => c.id === currentCharacterId);
    if (character) {
        renderGallery(character.gallery || []);
        const bonds = character.family_bonds
            ? (typeof character.family_bonds === 'string' ? JSON.parse(character.family_bonds) : character.family_bonds)
            : [];
        renderFamilyBonds(bonds);
    }
}