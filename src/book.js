// ---------- Navegación de páginas ----------

function showPage(pageNumber) {
    [page1, page2, page3, page4, page5, page6].forEach(page => {
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

    // Página 2: Personalidad
    document.getElementById('temperament-1').textContent = character.temperament_1 || '—';
    document.getElementById('temperament-2').textContent = character.temperament_2 || '—';
    document.getElementById('temperament-3').textContent = character.temperament_3 || '—';
    document.getElementById('presence-text').textContent = character.presence || 'Cómo se siente su presencia. Energía, ritmo y sensación que deja.';
    document.getElementById('first-impression-text').textContent = character.first_impression || 'Qué se prejuzga sin conocerlo.';
    document.getElementById('primary-need').textContent = character.primary_need || 'Aquello que necesita para sentirse completo (Ej.: Pertenecer / Control).';
    document.getElementById('root-belief').textContent = character.root_belief || 'Ej.: "Si no soy útil, no valgo." / "El afecto siempre tiene un costo."';
    document.getElementById('automatic-impulse').textContent = character.automatic_impulse || 'Reacción instintiva ante la amenaza.';
    document.getElementById('conflict-force-a').textContent = character.conflict_force_a || 'Ej.: Desea cercanía';
    document.getElementById('conflict-force-b').textContent = character.conflict_force_b || 'Ej.: Teme depender';
    document.getElementById('greatest-fear').textContent = character.greatest_fear || 'Ser abandonado';

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

    // Capas de personalidad
    document.getElementById('layer-public-text').textContent = character.layer_public || 'Cómo se presenta al mundo';
    document.getElementById('layer-private-text').textContent = character.layer_private || 'Cómo es con quienes confía';
    document.getElementById('layer-alone-text').textContent = character.layer_alone || 'Cómo es cuando nadie lo ve';

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
    document.getElementById('family-role-current').textContent = character.family_role_current || '—';
    document.getElementById('family-role-desired').textContent = character.family_role_desired || '—';
    document.getElementById('family-disappointment').textContent = character.family_disappointment || '—';
    document.getElementById('family-pride').textContent = character.family_pride || '—';
    document.getElementById('family-traditions').textContent = character.family_traditions || '—';
    document.getElementById('family-taboos').textContent = character.family_taboos || '—';

    const familyBonds = character.family_bonds
        ? (typeof character.family_bonds === 'string' ? JSON.parse(character.family_bonds) : character.family_bonds)
        : [];
    renderFamilyBonds(familyBonds);

    // Página 5: Historia y galería
    document.getElementById('character-story').textContent = character.story || 'La historia del personaje aparecerá aquí...';
    renderGallery(character.gallery || []);
}

// ---------- Modo edición ----------

// Lista de textos considerados placeholders
const placeholderValues = [
    '—', 'DD/MM/YYYY', '—cm', '—kg',
    'La historia del personaje aparecerá aquí...',
    'Cómo se siente su presencia. Energía, ritmo y sensación que deja.',
    'Qué se prejuzga sin conocerlo.',
    'Aquello que necesita para sentirse completo (Ej.: Pertenecer / Control).',
    'Ej.: "Si no soy útil, no valgo." / "El afecto siempre tiene un costo."',
    'Reacción instintiva ante la amenaza.',
    'Ej.: Desea cercanía', 'Ej.: Teme depender', 'Ser abandonado',
    'Sarcasmo cortante', 'Sonrisa contenida', 'Hiperactividad, necesidad de control',
    'Silencio, aislamiento', 'Ligera elevación de cejas', 'Mueca sutil',
    'Que lo subestimen, perder el control',
    'Silencios prolongados, preguntas sobre su pasado',
    'Rutinas predecibles, que le pidan consejo',
    'Cómo se presenta al mundo', 'Cómo es con quienes confía', 'Cómo es cuando nadie lo ve'
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

    const character = characters.find(c => c.id === currentCharacterId);
    if (character) {
        renderGallery(character.gallery || []);
        const bonds = character.family_bonds
            ? (typeof character.family_bonds === 'string' ? JSON.parse(character.family_bonds) : character.family_bonds)
            : [];
        renderFamilyBonds(bonds);
    }
}