// ---------- Diálogo ----------

let allLinkableCharacters = [];

async function populateBondLinkedCharacterOptions() {
    const select = document.getElementById('bond-linked-character');
    select.innerHTML = '<option value="">Ninguno (solo texto)</option>';

    try {
        const { data, error } = await supabaseClient
            .from('characters')
            .select('id, name, user_id')
            .neq('id', currentCharacterId);

        if (error) throw error;

        allLinkableCharacters = data || [];
    } catch (error) {
        console.error('Error al cargar personajes para vincular:', error);
        allLinkableCharacters = [];
    }

    // Orden alfabético (insensible a mayúsculas/acentos)
    const sorted = [...allLinkableCharacters].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    sorted.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        select.appendChild(option);
    });
}

function handleBondLinkedCharacterChange(e) {
    const characterId = e.target.value;
    const reverseGroup = document.getElementById('bond-reverse-relationship-group');

    if (!characterId) {
        reverseGroup.classList.add('hidden');
        document.getElementById('bond-reverse-relationship').value = '';
        return;
    }

    const linkedCharacter = allLinkableCharacters.find(c => c.id === characterId);
    if (linkedCharacter) {
        document.getElementById('bond-name').value = linkedCharacter.name;
    }

    reverseGroup.classList.remove('hidden');
}

async function showAddFamilyBondDialog() {
    addFamilyBondDialog.classList.remove('hidden');
    document.getElementById('bond-name').value = '';
    document.getElementById('bond-relationship').value = '';
    ['bond-affinity', 'bond-trust', 'bond-admiration', 'bond-influence', 'bond-dependence']
        .forEach(id => { document.getElementById(id).value = 5; });
    document.getElementById('bond-notes').value = '';
    document.getElementById('bond-linked-character').value = '';
    document.getElementById('bond-reverse-relationship').value = '';
    document.getElementById('bond-reverse-relationship-group').classList.add('hidden');
    await populateBondLinkedCharacterOptions();
}

function hideAddFamilyBondDialog() {
    addFamilyBondDialog.classList.add('hidden');
}

// ---------- Añadir vínculo ----------

async function addNewFamilyBond(e) {
    e.preventDefault();

    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }

    const name              = document.getElementById('bond-name').value.trim();
    const relationship      = document.getElementById('bond-relationship').value.trim();
    const linkedCharacterId = document.getElementById('bond-linked-character').value || null;
    const reverseRelationship = document.getElementById('bond-reverse-relationship').value.trim();
    const affinity          = parseInt(document.getElementById('bond-affinity').value);
    const trust             = parseInt(document.getElementById('bond-trust').value);
    const admiration        = parseInt(document.getElementById('bond-admiration').value);
    const influence         = parseInt(document.getElementById('bond-influence').value);
    const dependence        = parseInt(document.getElementById('bond-dependence').value);
    const notes             = document.getElementById('bond-notes').value.trim();

    if (!name || !relationship) {
        showNotification('Por favor, completa el nombre y vínculo', 'error');
        return;
    }

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    if (!character.family_bonds) character.family_bonds = [];

    const newBond = {
        id: Date.now().toString(),
        name, relationship,
        linkedCharacterId,
        metrics: { affinity, trust, admiration, influence, dependence },
        notes
    };

    try {
        character.family_bonds.push(newBond);

        const { error } = await supabaseClient
            .from('characters')
            .update({ family_bonds: character.family_bonds })
            .eq('id', character.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        renderFamilyBonds(character.family_bonds);
        hideAddFamilyBondDialog();
        showNotification('Vínculo familiar añadido');

        if (linkedCharacterId) {
            await addReciprocalFamilyBond(linkedCharacterId, character, reverseRelationship || relationship);
        }
    } catch (error) {
        character.family_bonds.pop();
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// ---------- Reflejar el vínculo en el personaje vinculado ----------

async function addReciprocalFamilyBond(targetCharacterId, sourceCharacter, reverseRelationship) {
    const reciprocalBond = {
        id: `${Date.now()}-r`,
        name: sourceCharacter.name,
        relationship: reverseRelationship,
        linkedCharacterId: sourceCharacter.id,
        metrics: { affinity: 5, trust: 5, admiration: 5, influence: 5, dependence: 5 },
        notes: ''
    };

    try {
        const { error } = await supabaseClient.rpc('add_reciprocal_family_bond', {
            target_character_id: targetCharacterId,
            new_bond: reciprocalBond
        });

        if (error) throw error;

        // Si el personaje vinculado ya está cargado localmente (misma biblioteca), lo reflejamos al toque
        const targetCharacter = characters.find(c => c.id === targetCharacterId);
        if (targetCharacter) {
            if (!targetCharacter.family_bonds) targetCharacter.family_bonds = [];
            targetCharacter.family_bonds.push(reciprocalBond);
        }

        showNotification('Vínculo reflejado en el otro personaje');
    } catch (error) {
        console.error('Error al reflejar el vínculo en el otro personaje:', error);
        showNotification(
            'El vínculo se guardó, pero no se pudo reflejar automáticamente en el otro personaje. ' +
            'Puede que falte crear la función add_reciprocal_family_bond en Supabase.',
            'error'
        );
    }
}

// ---------- Abrir un personaje vinculado (propio o de otro usuario) ----------

async function openLinkedCharacter(characterId) {
    let character = characters.find(c => c.id === characterId);

    if (!character) {
        try {
            const { data, error } = await supabaseClient
                .from('characters')
                .select('*')
                .eq('id', characterId)
                .single();

            if (error) throw error;
            if (!data) throw new Error('No existe');

            character = data;
            characters.push(character);
        } catch (error) {
            showNotification('El personaje vinculado ya no existe o no se pudo cargar', 'error');
            return;
        }
    }

    openBook(characterId);
}

// ---------- Eliminar vínculo ----------

async function removeFamilyBond(bondId) {
    if (!currentUser || viewingUserId !== currentUser.id) {
        showNotification('No tienes permiso para editar este personaje', 'error');
        return;
    }

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character || !character.family_bonds) return;

    const bondIndex = character.family_bonds.findIndex(b => b.id === bondId);
    if (bondIndex === -1) return;

    const removedBond = character.family_bonds[bondIndex];

    try {
        character.family_bonds.splice(bondIndex, 1);

        const { error } = await supabaseClient
            .from('characters')
            .update({ family_bonds: character.family_bonds })
            .eq('id', character.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        renderFamilyBonds(character.family_bonds);
        showNotification('Vínculo eliminado');
    } catch (error) {
        character.family_bonds.splice(bondIndex, 0, removedBond);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// ---------- Renderizar vínculos ----------

function renderFamilyBonds(bonds) {
    const container = document.getElementById('family-bonds-container');
    container.innerHTML = '';

    if (!bonds || bonds.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-placeholder';
        empty.textContent = 'No hay vínculos familiares añadidos.';
        container.appendChild(empty);
        return;
    }

    bonds.forEach(bond => {
        const bondCard = document.createElement('div');
        bondCard.className = 'family-bond-card';

        // Header
        const bondHeader = document.createElement('div');
        bondHeader.className = 'bond-header';

        const bondInfo = document.createElement('div');
        const bondTitle = document.createElement('div');
        bondTitle.className = 'bond-title';

        if (bond.linkedCharacterId) {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'bond-title-link';
            link.innerHTML = `<i class="fas fa-link"></i> ${bond.name}`;
            link.title = 'Ver la ficha vinculada';
            link.addEventListener('click', async (ev) => {
                ev.preventDefault();
                if (editMode && !confirm('Tenés cambios sin guardar en este personaje. ¿Ir de todas formas a la ficha vinculada?')) {
                    return;
                }
                await openLinkedCharacter(bond.linkedCharacterId);
            });
            bondTitle.appendChild(link);
        } else {
            bondTitle.textContent = bond.name;
        }

        const bondRelationship = document.createElement('div');
        bondRelationship.className = 'bond-relationship';
        bondRelationship.textContent = bond.relationship;

        bondInfo.appendChild(bondTitle);
        bondInfo.appendChild(bondRelationship);
        bondHeader.appendChild(bondInfo);

        if (editMode) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-bond-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', () => removeFamilyBond(bond.id));
            bondHeader.appendChild(deleteBtn);
        }

        // Contenido
        const bondContent = document.createElement('div');
        bondContent.className = 'bond-content';

        // Gráfico radar
        const chartContainer = document.createElement('div');
        chartContainer.className = 'radar-chart-container';

        const canvas = document.createElement('canvas');
        canvas.className = 'radar-chart';
        canvas.id = `radar-chart-${bond.id}`;
        canvas.width = 480;
        canvas.height = 450;

        if (editMode) {
            const metricsControls = document.createElement('div');
            metricsControls.className = 'metrics-controls';

            const metricsLabels = [
                { key: 'affinity',   label: 'Afinidad' },
                { key: 'trust',      label: 'Confianza' },
                { key: 'admiration', label: 'Admiración' },
                { key: 'influence',  label: 'Influencia' },
                { key: 'dependence', label: 'Dependencia' }
            ];

            metricsLabels.forEach(metric => {
                const controlRow = document.createElement('div');
                controlRow.className = 'metric-control-row';

                const label = document.createElement('span');
                label.className = 'metric-label';
                label.textContent = metric.label;

                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.max = '10';
                input.value = bond.metrics[metric.key];
                input.className = 'metric-input';
                input.dataset.bondId = bond.id;
                input.dataset.metric = metric.key;

                input.addEventListener('input', function () {
                    const character = characters.find(c => c.id === currentCharacterId);
                    if (!character || !character.family_bonds) return;
                    const bondToUpdate = character.family_bonds.find(b => b.id === this.dataset.bondId);
                    if (bondToUpdate) {
                        bondToUpdate.metrics[this.dataset.metric] = parseInt(this.value);
                        drawRadarChart(canvas.id, bondToUpdate.metrics);
                    }
                });

                controlRow.appendChild(label);
                controlRow.appendChild(input);
                metricsControls.appendChild(controlRow);
            });

            chartContainer.appendChild(metricsControls);
        }

        chartContainer.appendChild(canvas);

        // Notas
        const notesSection = document.createElement('div');
        notesSection.className = 'bond-notes-section';

        const notesLabel = document.createElement('div');
        notesLabel.className = 'bond-notes-label';
        notesLabel.textContent = 'Notas sobre la relación:';

        const notesContent = document.createElement('div');
        notesContent.className = 'bond-notes-content editable';
        notesContent.contentEditable = editMode ? 'true' : 'false';
        notesContent.textContent = bond.notes || 'Sin notas adicionales.';
        notesContent.dataset.bondId = bond.id;

        notesSection.appendChild(notesLabel);
        notesSection.appendChild(notesContent);

        bondContent.appendChild(chartContainer);
        bondContent.appendChild(notesSection);

        bondCard.appendChild(bondHeader);
        bondCard.appendChild(bondContent);
        container.appendChild(bondCard);

        drawRadarChart(canvas.id, bond.metrics);
    });
}

// ---------- Gráfico radar (Canvas) ----------

function drawRadarChart(canvasId, metrics) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3.2;

    ctx.clearRect(0, 0, width, height);

    const labels = ['Afinidad', 'Confianza', 'Admiración', 'Influencia', 'Dependencia'];
    const values = [metrics.affinity, metrics.trust, metrics.admiration, metrics.influence, metrics.dependence];
    const numPoints = labels.length;
    const angleStep = (Math.PI * 2) / numPoints;

    const gridColor        = 'rgba(200, 200, 200, 0.3)';
    const axisColor        = 'rgba(150, 150, 150, 0.5)';
    const dataFillColor    = 'rgba(188, 107, 255, 0.4)';
    const dataStrokeColor  = 'rgb(165, 87, 255)';
    const labelColor       = '#333333';
    const levels           = 5;

    // Grid concéntrico
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 1; i <= levels; i++) {
        ctx.beginPath();
        const levelRadius = (radius / levels) * i;
        for (let j = 0; j <= numPoints; j++) {
            const angle = angleStep * j - Math.PI / 2;
            const x = centerX + Math.cos(angle) * levelRadius;
            const y = centerY + Math.sin(angle) * levelRadius;
            j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Ejes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < numPoints; i++) {
        const angle = angleStep * i - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
    }

    // Números en los niveles
    ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= levels; i++) {
        const levelRadius = (radius / levels) * i;
        ctx.fillText(Math.round((10 / levels) * i), centerX, centerY - levelRadius - 5);
    }

    // Polígono de datos
    ctx.fillStyle = dataFillColor;
    ctx.strokeStyle = dataStrokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
        const angle = angleStep * i - Math.PI / 2;
        const distance = ((values[i] || 0) / 10) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Puntos en los vértices
    ctx.fillStyle = dataStrokeColor;
    for (let i = 0; i < numPoints; i++) {
        const angle = angleStep * i - Math.PI / 2;
        const distance = ((values[i] || 0) / 10) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = dataStrokeColor;
        ctx.lineWidth = 2.5;
    }

    // Etiquetas
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 13px Arial';
    for (let i = 0; i < numPoints; i++) {
        const angle = angleStep * i - Math.PI / 2;
        const labelDistance = radius + 35;
        let x = centerX + Math.cos(angle) * labelDistance;
        let y = centerY + Math.sin(angle) * labelDistance;

        if (Math.abs(angle + Math.PI / 2) < 0.1) {
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; y -= 5;
        } else if (Math.abs(angle - Math.PI / 2) < 0.1) {
            ctx.textAlign = 'center'; ctx.textBaseline = 'top'; y += 5;
        } else if (angle > -Math.PI / 2 && angle < Math.PI / 2) {
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; x += 8;
        } else {
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; x -= 8;
        }

        ctx.fillText(labels[i], x, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
}