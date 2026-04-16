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

    const name = document.getElementById('relation-name').value.trim();
    const type = document.getElementById('relation-type').value;

    if (!name) {
        showNotification('Por favor, introduce un nombre para la relación', 'error');
        return;
    }

    const character = characters.find(c => c.id === currentCharacterId);
    if (!character) return;
    if (!character.relations) character.relations = [];

    const newRelation = {
        name,
        type,
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