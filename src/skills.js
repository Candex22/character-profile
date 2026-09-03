// ---------- Habilidades: Diccionarios de etiquetas ----------

const MANA_TYPE_LABELS = {
    nutritivo: 'Nutritivo',
    convencional: 'Convencional',
    versatil: 'Versátil',
    corrosivo: 'Corrosivo',
    no_identificado: 'No identificado'
};

const WARRIOR_CATEGORY_LABELS = {
    melee: 'Cuerpo a cuerpo',
    ranged: 'Combate a distancia',
    support: 'Soporte'
};

const WARRIOR_SUBTYPE_LABELS = {
    tanque: 'Tanque',
    luchador: 'Luchador',
    asesino: 'Asesino',
    esgrimista: 'Esgrimista',
    tirador: 'Tirador',
    mago: 'Mago'
};

const WARRIOR_CATEGORY_SUBTYPES = {
    melee: ['tanque', 'luchador', 'asesino', 'esgrimista'],
    ranged: ['tirador', 'mago'],
    support: []
};

const ELEMENT_LABELS = {
    agua: 'Agua',
    viento: 'Viento',
    fuego: 'Fuego',
    tierra: 'Tierra',
    rayo: 'Rayo'
};

const SUBELEMENT_LABELS = {
    hielo: 'Hielo',
    calor: 'Calor',
    iman: 'Imán',
    explosion: 'Explosión',
    cristal: 'Cristal',
    lava: 'Lava',
    barro: 'Barro',
    madera: 'Madera',
    vapor: 'Vapor',
    tormenta: 'Tormenta',
    plasma: 'Plasma'
};

// ---------- Habilidades: Disponibilidad dinámica (modo edición) ----------

function updateSubelementAvailability() {
    const selectedElements = new Set(
        Array.from(document.querySelectorAll('.element-checkbox:checked')).map(el => el.dataset.element)
    );

    document.querySelectorAll('.subelement-checkbox').forEach(checkbox => {
        const requires = (checkbox.dataset.requires || '').split(',').map(s => s.trim()).filter(Boolean);
        const requirementMet = requires.every(req => selectedElements.has(req));

        checkbox.disabled = !editMode || !requirementMet;
        if (!requirementMet) checkbox.checked = false;

        const option = checkbox.closest('.subelement-option');
        if (option) option.classList.toggle('unavailable', !requirementMet);
    });
}

function updateWarriorSubtypeAvailability() {
    document.querySelectorAll('.warrior-category-checkbox').forEach(categoryCheckbox => {
        const category = categoryCheckbox.dataset.category;
        const categorySelected = categoryCheckbox.checked;

        document.querySelectorAll(`.warrior-subtype-checkbox[data-category="${category}"]`).forEach(subCheckbox => {
            subCheckbox.disabled = !editMode || !categorySelected;
            if (!categorySelected) subCheckbox.checked = false;
        });

        const subtypesContainer = document.querySelector(`.warrior-subtypes[data-category-subtypes="${category}"]`);
        if (subtypesContainer) subtypesContainer.classList.toggle('unavailable', !categorySelected);
    });
}

// ---------- Habilidades: Construcción de las "rta" (tags) de vista ----------

function renderTagList(containerId, tags) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!tags.length) {
        const empty = document.createElement('span');
        empty.className = 'empty-tag';
        empty.textContent = '—';
        container.appendChild(empty);
        return;
    }

    tags.forEach(text => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = text;
        container.appendChild(tag);
    });
}

function getSelectedWarriorTags() {
    const tags = [];

    Object.keys(WARRIOR_CATEGORY_LABELS).forEach(category => {
        const categoryCheckbox = document.querySelector(`.warrior-category-checkbox[data-category="${category}"]`);
        if (!categoryCheckbox || !categoryCheckbox.checked) return;

        const checkedSubtypes = WARRIOR_CATEGORY_SUBTYPES[category].filter(subtype => {
            const el = document.querySelector(`.warrior-subtype-checkbox[data-category="${category}"][data-subtype="${subtype}"]`);
            return el && el.checked;
        });

        if (checkedSubtypes.length > 0) {
            checkedSubtypes.forEach(subtype => tags.push(WARRIOR_SUBTYPE_LABELS[subtype]));
        } else {
            tags.push(WARRIOR_CATEGORY_LABELS[category]);
        }
    });

    return tags;
}

function getSelectedElementTags() {
    return Array.from(document.querySelectorAll('.element-checkbox:checked'))
        .map(el => ELEMENT_LABELS[el.dataset.element]);
}

function getSelectedSubelementTags() {
    return Array.from(document.querySelectorAll('.subelement-checkbox:checked'))
        .map(el => SUBELEMENT_LABELS[el.dataset.subelement]);
}

function syncSkillsViewFromInputs() {
    // Tipo de maná
    const manaTypeSelect = document.getElementById('mana-type-select');
    const manaTypeDisplay = document.getElementById('mana-type-display');
    if (manaTypeDisplay) {
        manaTypeDisplay.textContent = (manaTypeSelect && manaTypeSelect.value)
            ? (MANA_TYPE_LABELS[manaTypeSelect.value] || manaTypeSelect.value)
            : '—';
    }

    const manaControlInput = document.getElementById('mana-control-input');
    const manaControlDisplay = document.getElementById('mana-control-display');
    if (manaControlDisplay) {
        manaControlDisplay.textContent = `${manaControlInput ? (manaControlInput.value || 0) : 0}%`;
    }

    // Tipo de guerrero
    renderTagList('warrior-type-view', getSelectedWarriorTags());

    // Elementos y subelementos
    renderTagList('elements-view', getSelectedElementTags());
    renderTagList('subelements-view', getSelectedSubelementTags());
}

// ---------- Habilidades: Modo edición ----------

function setSkillsEditMode(enabled) {
    document.getElementById('mana-type-display').classList.toggle('hidden', enabled);
    document.getElementById('mana-type-select').classList.toggle('hidden', !enabled);

    document.getElementById('mana-control-display').classList.toggle('hidden', enabled);
    document.querySelector('.mana-control-edit-wrapper').classList.toggle('hidden', !enabled);

    document.getElementById('warrior-type-view').classList.toggle('hidden', enabled);
    document.getElementById('warrior-type-edit').classList.toggle('hidden', !enabled);

    document.getElementById('elements-view').classList.toggle('hidden', enabled);
    document.getElementById('elements-edit').classList.toggle('hidden', !enabled);

    document.getElementById('subelements-view').classList.toggle('hidden', enabled);
    document.getElementById('subelements-edit').classList.toggle('hidden', !enabled);

    // Recalcula qué queda habilitado según dependencias (usa la variable global editMode)
    updateWarriorSubtypeAvailability();
    updateSubelementAvailability();

    if (!enabled) {
        syncSkillsViewFromInputs();
    }
}

// ---------- Habilidades: Llenado de datos ----------

function fillSkills(character) {
    // Tipo de maná
    const manaTypeSelect = document.getElementById('mana-type-select');
    if (manaTypeSelect) manaTypeSelect.value = character.mana_type || '';

    const manaControlInput = document.getElementById('mana-control-input');
    if (manaControlInput) manaControlInput.value = character.mana_control ?? 0;

    // Tipo de guerrero
    const warriorTypes = character.warrior_types
        ? (typeof character.warrior_types === 'string' ? JSON.parse(character.warrior_types) : character.warrior_types)
        : {};

    document.querySelectorAll('.warrior-category-checkbox').forEach(checkbox => {
        const category = checkbox.dataset.category;
        checkbox.checked = !!(warriorTypes[category] && warriorTypes[category].selected);
    });

    document.querySelectorAll('.warrior-subtype-checkbox').forEach(checkbox => {
        const category = checkbox.dataset.category;
        const subtype = checkbox.dataset.subtype;
        checkbox.checked = !!(warriorTypes[category] && warriorTypes[category][subtype]);
    });

    // Elementos
    const elements = character.elements
        ? (typeof character.elements === 'string' ? JSON.parse(character.elements) : character.elements)
        : {};
    document.querySelectorAll('.element-checkbox').forEach(checkbox => {
        checkbox.checked = !!elements[checkbox.dataset.element];
    });

    // Subelementos
    const subelements = character.subelements
        ? (typeof character.subelements === 'string' ? JSON.parse(character.subelements) : character.subelements)
        : {};
    document.querySelectorAll('.subelement-checkbox').forEach(checkbox => {
        checkbox.checked = !!subelements[checkbox.dataset.subelement];
    });

    // Recalcula disponibilidad y arma la vista con lo recién cargado
    updateWarriorSubtypeAvailability();
    updateSubelementAvailability();
    syncSkillsViewFromInputs();
}

// ---------- Habilidades: Recolección de datos para guardar ----------

function collectSkillsData(character) {
    const manaTypeSelect = document.getElementById('mana-type-select');
    character.mana_type = manaTypeSelect && manaTypeSelect.value ? manaTypeSelect.value : null;

    const manaControlInput = document.getElementById('mana-control-input');
    character.mana_control = manaControlInput
        ? Math.max(0, Math.min(100, parseInt(manaControlInput.value) || 0))
        : 0;

    const warriorTypes = {};
    document.querySelectorAll('.warrior-category-checkbox').forEach(checkbox => {
        warriorTypes[checkbox.dataset.category] = { selected: checkbox.checked };
    });
    document.querySelectorAll('.warrior-subtype-checkbox').forEach(checkbox => {
        const category = checkbox.dataset.category;
        const subtype = checkbox.dataset.subtype;
        if (!warriorTypes[category]) warriorTypes[category] = { selected: false };
        warriorTypes[category][subtype] = checkbox.checked;
    });
    character.warrior_types = warriorTypes;

    const elements = {};
    document.querySelectorAll('.element-checkbox').forEach(checkbox => {
        elements[checkbox.dataset.element] = checkbox.checked;
    });
    character.elements = elements;

    const subelements = {};
    document.querySelectorAll('.subelement-checkbox').forEach(checkbox => {
        subelements[checkbox.dataset.subelement] = checkbox.checked;
    });
    character.subelements = subelements;
}