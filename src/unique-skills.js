// ---------- Diálogo ----------

function showAddUniqueSkillDialog() {
    addUniqueSkillDialog.classList.remove('hidden');
    document.getElementById('unique-skill-name').value = '';
    document.getElementById('unique-skill-type').value = '';
    document.getElementById('unique-skill-description').value = '';
    uniqueSkillImagePreview.src = '/api/placeholder/100/100';
}

function hideAddUniqueSkillDialog() {
    addUniqueSkillDialog.classList.add('hidden');
}

// ---------- Añadir habilidad ----------

async function addNewUniqueSkill(e) {
    e.preventDefault();

    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }

    const name        = document.getElementById('unique-skill-name').value.trim();
    const type        = document.getElementById('unique-skill-type').value.trim();
    const description = document.getElementById('unique-skill-description').value.trim();

    if (!name || !type) {
        showNotification('Por favor, completa el nombre y el tipo de habilidad', 'error');
        return;
    }

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    if (!character.unique_skills) character.unique_skills = [];

    const newSkill = {
        id: Date.now().toString(),
        name,
        type,
        description,
        image: uniqueSkillImagePreview.src !== '/api/placeholder/100/100' ? uniqueSkillImagePreview.src : null
    };

    try {
        character.unique_skills.push(newSkill);

        const { error } = await supabaseClient
            .from('characters')
            .update({ unique_skills: character.unique_skills })
            .eq('id', character.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        renderUniqueSkills(character.unique_skills);
        hideAddUniqueSkillDialog();
        showNotification('Habilidad añadida');
    } catch (error) {
        character.unique_skills.pop();
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// ---------- Eliminar habilidad ----------

async function removeUniqueSkill(skillId) {
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character || !character.unique_skills) return;

    const skillIndex = character.unique_skills.findIndex(s => s.id === skillId);
    if (skillIndex === -1) return;

    const removedSkill = character.unique_skills[skillIndex];

    try {
        character.unique_skills.splice(skillIndex, 1);

        const { error } = await supabaseClient
            .from('characters')
            .update({ unique_skills: character.unique_skills })
            .eq('id', character.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        renderUniqueSkills(character.unique_skills);
        showNotification('Habilidad eliminada');
    } catch (error) {
        character.unique_skills.splice(skillIndex, 0, removedSkill);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// ---------- Renderizar habilidades ----------

function renderUniqueSkills(skills) {
    const container = document.getElementById('unique-skills-container');
    container.innerHTML = '';

    if (!skills || skills.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-placeholder';
        empty.textContent = 'No hay habilidades únicas añadidas.';
        container.appendChild(empty);
        return;
    }

    skills.forEach(skill => {
        const card = document.createElement('div');
        card.className = 'unique-skill-card';

        // Imagen a la izquierda
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'unique-skill-image-wrapper';
        const image = document.createElement('img');
        image.className = 'unique-skill-image';
        image.src = skill.image || '/api/placeholder/100/100';
        image.alt = skill.name;
        imageWrapper.appendChild(image);

        // Contenido
        const content = document.createElement('div');
        content.className = 'unique-skill-content';

        const header = document.createElement('div');
        header.className = 'unique-skill-header';

        const titleBlock = document.createElement('div');
        const nameEl = document.createElement('div');
        nameEl.className = 'unique-skill-name';
        nameEl.textContent = skill.name;
        const typeEl = document.createElement('div');
        typeEl.className = 'unique-skill-type';
        typeEl.textContent = skill.type;
        titleBlock.appendChild(nameEl);
        titleBlock.appendChild(typeEl);
        header.appendChild(titleBlock);

        if (editMode) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-bond-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', () => removeUniqueSkill(skill.id));
            header.appendChild(deleteBtn);
        }

        const descriptionEl = document.createElement('div');
        descriptionEl.className = 'unique-skill-description editable';
        descriptionEl.contentEditable = editMode ? 'true' : 'false';
        descriptionEl.textContent = skill.description || 'Sin descripción.';
        descriptionEl.dataset.skillId = skill.id;

        content.appendChild(header);
        content.appendChild(descriptionEl);

        card.appendChild(imageWrapper);
        card.appendChild(content);
        container.appendChild(card);
    });
}