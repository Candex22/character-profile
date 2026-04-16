// ---------- Notificaciones ----------

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

    setTimeout(() => { notification.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => { document.body.removeChild(notification); }, 300);
    }, 3000);
}

// ---------- Lightbox ----------

function setupLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxClose = document.getElementById('lightbox-close');

    lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });
}

function openLightbox(imageSrc) {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    lightboxImage.src = imageSrc;
    lightbox.classList.add('active');
}

function closeLightbox() {
    document.getElementById('image-lightbox').classList.remove('active');
}

// ---------- Círculos de personajes ----------

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

        circle.addEventListener('click', () => openBook(character.id));

        characterCircleContainer.appendChild(circle);
    });
}