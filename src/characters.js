// ---------- Cargar desde Supabase ----------

async function loadCharacters() {
    try {
        if (!viewingUserId) return;

        const { data, error } = await supabaseClient
            .from('characters')
            .select('*')
            .eq('user_id', viewingUserId);

        if (error) throw error;

        characters = data || [];
        currentFolderId = null;
        updateFolderBreadcrumb();
        await loadFolders();
        renderCharacterCircles();
    } catch (error) {
        showNotification(`Error al cargar personajes: ${error.message}`, 'error');
    }
}

// ---------- Crear personaje ----------

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

    if (!currentUser) {
        showNotification('Debes iniciar sesión para crear personajes', 'error');
        return;
    }

    const name = document.getElementById('new-character-name').value.trim();
    if (!name) {
        showNotification('Por favor, introduce un nombre para el personaje', 'error');
        return;
    }

    try {
        const defaultPersonality = {};
        for (let i = 1; i <= 18; i++) {
            const slider = document.getElementById(`trait-${i}`);
            if (slider) defaultPersonality[slider.getAttribute('data-trait')] = 50;
        }

        const newCharacter = {
            user_id: currentUser.id,
            name,
            image: newCharacterImagePreview.src === '/api/placeholder/150/150' ? null : newCharacterImagePreview.src,
            personality: JSON.stringify(defaultPersonality),
            gallery: JSON.stringify([]),
            folder_id: currentFolderId
        };

        console.log("Intentando crear personaje:", newCharacter);

        const { data, error } = await supabaseClient
            .from('characters')
            .insert([newCharacter])
            .select();

        if (error) { console.error("Error detallado:", error); throw error; }

        console.log("Personaje creado:", data);

        const newCharacterId = data[0].id;
        const characterForUI = {
            id: newCharacterId,
            user_id: currentUser.id,
            name,
            image: newCharacterImagePreview.src !== '/api/placeholder/150/150' ? newCharacterImagePreview.src : null,
            personality: defaultPersonality,
            gallery: [],
            folder_id: currentFolderId
        };

        characters.push(characterForUI);
        renderFolders();
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

// ---------- Guardar personaje ----------

async function saveCharacter() {
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;

    // Información básica
    character.name       = document.getElementById('character-name').textContent;
    character.age        = document.getElementById('character-age').textContent;
    character.birthday   = document.getElementById('character-birthday').textContent;
    character.occupation = document.getElementById('character-occupation').textContent;
    character.race       = document.getElementById('character-race').textContent;
    character.origin     = document.getElementById('character-origin').textContent;
    character.location   = document.getElementById('character-location').textContent;

    // Apariencia física
    character.face               = document.getElementById('character-face').textContent;
    character.height             = document.getElementById('character-height').textContent;
    character.weight             = document.getElementById('character-weight').textContent;
    character.hair_color         = document.getElementById('character-hair-color').textContent;
    character.hair_style         = document.getElementById('character-hair-style').textContent;
    character.facial_decorations = document.getElementById('character-facial-decorations').textContent;
    character.skin               = document.getElementById('character-skin').textContent;
    character.scars              = document.getElementById('character-scars').textContent;
    character.tattoos            = document.getElementById('character-tattoos').textContent;
    character.piercings          = document.getElementById('character-piercings').textContent;
    character.birthmarks         = document.getElementById('character-birthmarks').textContent;

    // Voz
    character.voice           = document.getElementById('character-voice').textContent;
    character.speaking_style  = document.getElementById('character-speaking-style').textContent;
    character.speaking_rhythm = document.getElementById('character-speaking-rhythm').textContent;
    character.speaking_tempo  = document.getElementById('character-speaking-tempo').textContent;
    character.pronunciation   = document.getElementById('character-pronunciation').textContent;
    character.accent          = document.getElementById('character-accent').textContent;

    // Personalidad — Impresión general
    character.temperament_1    = document.getElementById('temperament-1').textContent;
    character.temperament_2    = document.getElementById('temperament-2').textContent;
    character.temperament_3    = document.getElementById('temperament-3').textContent;
    character.presence         = document.getElementById('presence-text').textContent;
    character.first_impression = document.getElementById('first-impression-text').textContent;

    // Núcleo interno
    character.primary_need      = document.getElementById('primary-need').textContent;
    character.root_belief       = document.getElementById('root-belief').textContent;
    character.automatic_impulse = document.getElementById('automatic-impulse').textContent;
    character.conflict_force_a  = document.getElementById('conflict-force-a').textContent;
    character.conflict_force_b  = document.getElementById('conflict-force-b').textContent;
    character.greatest_fear     = document.getElementById('greatest-fear').textContent;

    // Espectro emocional
    const emotions = ['anger', 'joy', 'fear', 'sadness', 'surprise', 'disgust'];
    emotions.forEach(e => {
        character[`emotion_${e}`]    = parseInt(document.getElementById(`emotion-${e}`).value);
        character[`${e}_expression`] = document.getElementById(`${e}-expression`).textContent;
    });

    // Gatillos emocionales
    character.trigger_red    = document.getElementById('trigger-red').textContent;
    character.trigger_yellow = document.getElementById('trigger-yellow').textContent;
    character.trigger_green  = document.getElementById('trigger-green').textContent;

    // Capas de personalidad
    character.layer_public  = document.getElementById('layer-public-text').textContent;
    character.layer_private = document.getElementById('layer-private-text').textContent;
    character.layer_alone   = document.getElementById('layer-alone-text').textContent;

    // Página 3: Rasgos (sliders)
    const personality = {};
    document.querySelectorAll('.personality-slider').forEach(slider => {
        personality[slider.getAttribute('data-trait')] = parseInt(slider.value);
    });
    character.personality = personality;

    // Página 4: Vínculos familiares — datos generales
    character.family_climate       = document.getElementById('family-climate').textContent;
    character.family_role_current  = document.getElementById('family-role-current').textContent;
    character.family_role_desired  = document.getElementById('family-role-desired').textContent;
    character.family_disappointment = document.getElementById('family-disappointment').textContent;
    character.family_pride         = document.getElementById('family-pride').textContent;
    character.family_traditions    = document.getElementById('family-traditions').textContent;
    character.family_taboos        = document.getElementById('family-taboos').textContent;

    // Notas y métricas de cada vínculo familiar
    if (character.family_bonds) {
        const familyBonds = typeof character.family_bonds === 'string'
            ? JSON.parse(character.family_bonds)
            : character.family_bonds;

        familyBonds.forEach(bond => {
            const notesEl = document.querySelector(`.bond-notes-content[data-bond-id="${bond.id}"]`);
            if (notesEl) bond.notes = notesEl.textContent;

            document.querySelectorAll(`.metric-input[data-bond-id="${bond.id}"]`).forEach(input => {
                bond.metrics[input.dataset.metric] = parseInt(input.value);
            });
        });

        character.family_bonds = familyBonds;
    }

    // Página 5: Historia
    character.story = document.getElementById('character-story').textContent;

    try {
        const { error } = await supabaseClient
            .from('characters')
            .update(character)
            .eq('id', character.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        renderCharacterCircles();
        setEditMode(false);
        showNotification('Personaje guardado con éxito');
    } catch (error) {
        showNotification(`Error al guardar: ${error.message}`, 'error');
    }
}

// ---------- Eliminar personaje ----------

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

            characters = characters.filter(c => c.id !== currentCharacterId);
            closeBook();
            renderCharacterCircles();
            showNotification('Personaje eliminado');
        } catch (error) {
            showNotification(`Error al eliminar: ${error.message}`, 'error');
        }
    }
}

// ---------- Imagen principal ----------

function previewImage(input, imgElement) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => { imgElement.src = e.target.result; };
        reader.readAsDataURL(input.files[0]);
    }
}

async function updateCharacterImage(file) {
    if (!file || !currentUser || viewingUserId !== currentUser.id) return;

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
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