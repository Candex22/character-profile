// Estado de la aplicación
let characters = [];
let currentCharacterId = null;
let currentPage = 1;
const totalPages = 7;
let editMode = false;

// Estado de carpetas
let folders = [];
let currentFolderId = null; // null = raíz (todas las carpetas + personajes sin carpeta)
let characterIdToMove = null;

// Elementos del DOM — Libro y navegación
const characterCircleContainer = document.getElementById('character-circle-container');
const bookContainer = document.getElementById('book-container');
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const page3 = document.getElementById('page-3');
const page4 = document.getElementById('page-4');
const page5 = document.getElementById('page-5');
const page6 = document.getElementById('page-6');
const page7 = document.getElementById('page-7');
const pageIndicator = document.getElementById('page-indicator');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const closeBookBtn = document.getElementById('close-book');
const editCharacterBtn = document.getElementById('edit-character');
const saveCharacterBtn = document.getElementById('save-character');
const deleteCharacterBtn = document.getElementById('delete-character');

// Elementos del DOM — Personaje
const addCharacterBtn = document.getElementById('add-character-btn');
const addCharacterDialog = document.getElementById('add-character-dialog');
const newCharacterForm = document.getElementById('new-character-form');
const cancelAddCharacterBtn = document.getElementById('cancel-add-character');
const newCharacterImageInput = document.getElementById('new-character-image');
const newCharacterImagePreview = document.getElementById('new-character-image-preview');
const characterImageUpload = document.getElementById('character-image-upload');
const characterMainImage = document.getElementById('character-main-image');
const imageUploadOverlay = document.querySelector('.image-upload-overlay');

// Elementos del DOM — Relaciones
const addRelationDialog = document.getElementById('add-relation-dialog');
const newRelationForm = document.getElementById('new-relation-form');
const cancelAddRelationBtn = document.getElementById('cancel-add-relation');
const relationImageInput = document.getElementById('relation-image');
const relationImagePreview = document.getElementById('relation-image-preview');

// Elementos del DOM — Galería
const addGalleryImageBtn = document.getElementById('add-gallery-image-btn');
const galleryImageUpload = document.getElementById('gallery-image-upload');

// Elementos del DOM — Carpetas
const folderContainer = document.getElementById('folder-container');
const folderBreadcrumb = document.getElementById('folder-breadcrumb');
const backToRootBtn = document.getElementById('back-to-root-btn');
const folderBreadcrumbTrail = document.getElementById('folder-breadcrumb-trail');
const addFolderBtn = document.getElementById('add-folder-btn');
const addFolderDialog = document.getElementById('add-folder-dialog');
const newFolderForm = document.getElementById('new-folder-form');
const cancelAddFolderBtn = document.getElementById('cancel-add-folder');
const moveToFolderDialog = document.getElementById('move-to-folder-dialog');
const moveToFolderForm = document.getElementById('move-to-folder-form');
const moveToFolderSelect = document.getElementById('move-to-folder-select');
const cancelMoveToFolderBtn = document.getElementById('cancel-move-to-folder');

// Elementos del DOM — Vínculos familiares
const addFamilyBondDialog = document.getElementById('add-family-bond-dialog');
const newFamilyBondForm = document.getElementById('new-family-bond-form');
const cancelAddBondBtn = document.getElementById('cancel-add-bond');