// ---------- Habilidades: Tipo de maná ----------

function getSelectedManaType() {
    const checked = document.querySelector('.mana-type-radio:checked');
    return checked ? checked.value : null;
}

// ---------- Habilidades: Disponibilidad dinámica ----------

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

// ---------- Habilidades: Modo edición ----------

function setSkillsEditMode(enabled) {
    document.querySelectorAll('.mana-type-radio').forEach(r => { r.disabled = !enabled; });

    const manaControlInput = document.getElementById('mana-control-input');
    if (manaControlInput) manaControlInput.disabled = !enabled;

    document.querySelectorAll('.warrior-category-checkbox').forEach(c => { c.disabled = !enabled; });
    document.querySelectorAll('.element-checkbox').forEach(c => { c.disabled = !enabled; });

    // Estos recalculan sus propios disabled según dependencias + editMode
    updateWarriorSubtypeAvailability();
    updateSubelementAvailability();
}

// ---------- Habilidades: Llenado de datos ----------

function fillSkills(character) {
    // Tipo de maná
    document.querySelectorAll('.mana-type-radio').forEach(r => { r.checked = false; });
    if (character.mana_type) {
        const radio = document.querySelector(`.mana-type-radio[value="${character.mana_type}"]`);
        if (radio) radio.checked = true;
    }

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

    // Recalcula qué queda habilitado según lo que se acaba de cargar
    updateWarriorSubtypeAvailability();
    updateSubelementAvailability();
}

// ---------- Habilidades: Recolección de datos para guardar ----------

function collectSkillsData(character) {
    character.mana_type = getSelectedManaType();

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