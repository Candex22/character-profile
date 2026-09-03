// ---------- Diálogo ----------

function populateUniqueSkillParentOptions() {
    const select = document.getElementById('unique-skill-parent');
    select.innerHTML = '<option value="">Ninguna (habilidad primaria)</option>';

    const character = characters.find(c => c.id === currentCharacterId);
    const skills = character && character.unique_skills
        ? (typeof character.unique_skills === 'string' ? JSON.parse(character.unique_skills) : character.unique_skills)
        : [];

    skills.forEach(skill => {
        const option = document.createElement('option');
        option.value = skill.id;
        option.textContent = skill.name;
        select.appendChild(option);
    });
}

function showAddUniqueSkillDialog() {
    addUniqueSkillDialog.classList.remove('hidden');
    document.getElementById('unique-skill-name').value = '';
    document.getElementById('unique-skill-type').value = '';
    document.getElementById('unique-skill-description').value = '';
    uniqueSkillImagePreview.src = '/api/placeholder/100/100';
    populateUniqueSkillParentOptions();
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
    const parentId    = document.getElementById('unique-skill-parent').value || null;

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
        parentId,
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

// ---------- Eliminar habilidad (y sus derivadas) ----------

function collectSkillIdsWithDescendants(skillId, allSkills) {
    const ids = [skillId];
    allSkills
        .filter(s => s.parentId === skillId)
        .forEach(child => {
            ids.push(...collectSkillIdsWithDescendants(child.id, allSkills));
        });
    return ids;
}

async function removeUniqueSkill(skillId) {
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character || !character.unique_skills) return;

    const idsToRemove = collectSkillIdsWithDescendants(skillId, character.unique_skills);
    const hasChildren = idsToRemove.length > 1;

    if (hasChildren && !confirm('Esta habilidad tiene habilidades derivadas. ¿Eliminarla junto con todas sus derivadas?')) {
        return;
    }

    const previousSkills = character.unique_skills;

    try {
        character.unique_skills = previousSkills.filter(s => !idsToRemove.includes(s.id));

        const { error } = await supabaseClient
            .from('characters')
            .update({ unique_skills: character.unique_skills })
            .eq('id', character.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        renderUniqueSkills(character.unique_skills);
        showNotification('Habilidad eliminada');
    } catch (error) {
        character.unique_skills = previousSkills;
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// ---------- Renderizar habilidades (con derivadas anidadas) ----------

function buildUniqueSkillCard(skill, allSkills) {
    const children = allSkills.filter(s => s.parentId === skill.id);

    const card = document.createElement('div');
    card.className = 'unique-skill-card';
    card.dataset.skillId = skill.id;

    const mainRow = document.createElement('div');
    mainRow.className = 'unique-skill-main';

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
    titleBlock.className = 'unique-skill-title-block';

    if (children.length > 0) {
        const toggleIcon = document.createElement('i');
        toggleIcon.className = 'fas fa-chevron-right unique-skill-toggle-icon';
        titleBlock.appendChild(toggleIcon);
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'unique-skill-name';
    nameEl.textContent = skill.name;
    titleBlock.appendChild(nameEl);

    if (children.length > 0) {
        const countBadge = document.createElement('span');
        countBadge.className = 'unique-skill-child-count';
        countBadge.textContent = `${children.length} derivada${children.length > 1 ? 's' : ''}`;
        titleBlock.appendChild(countBadge);
    }

    const typeEl = document.createElement('div');
    typeEl.className = 'unique-skill-type';
    typeEl.textContent = skill.type;

    const titleWrapper = document.createElement('div');
    titleWrapper.appendChild(titleBlock);
    titleWrapper.appendChild(typeEl);
    header.appendChild(titleWrapper);

    if (editMode) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-bond-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            removeUniqueSkill(skill.id);
        });
        header.appendChild(deleteBtn);
    }

    const descriptionEl = document.createElement('div');
    descriptionEl.className = 'unique-skill-description editable';
    descriptionEl.contentEditable = editMode ? 'true' : 'false';
    descriptionEl.textContent = skill.description || 'Sin descripción.';
    descriptionEl.dataset.skillId = skill.id;
    descriptionEl.addEventListener('click', (ev) => ev.stopPropagation());

    content.appendChild(header);
    content.appendChild(descriptionEl);

    mainRow.appendChild(imageWrapper);
    mainRow.appendChild(content);
    card.appendChild(mainRow);

    // Derivadas anidadas: se cargan en el mismo lugar, dentro de la tarjeta padre
    if (children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'unique-skill-children';

        children.forEach(child => {
            childrenContainer.appendChild(buildUniqueSkillCard(child, allSkills));
        });

        card.appendChild(childrenContainer);
        card.classList.add('has-children');

        card.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });
    }

    return card;
}

function renderUniqueSkills(skills) {
    const container = document.getElementById('unique-skills-container');
    container.innerHTML = '';

    const allSkills = skills || [];

    if (!allSkills.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-placeholder';
        empty.textContent = 'No hay habilidades únicas añadidas.';
        container.appendChild(empty);
        return;
    }

    // Primarias: sin padre, o cuyo padre ya no existe (evita que se pierdan si se borró el origen)
    const topLevel = allSkills.filter(s => !s.parentId || !allSkills.some(p => p.id === s.parentId));

    topLevel.forEach(skill => {
        container.appendChild(buildUniqueSkillCard(skill, allSkills));
    });
}