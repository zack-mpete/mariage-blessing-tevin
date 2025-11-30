// Fonction pour créer et afficher la modale
function showImageModal(imageSrc, altText) {
    // Créer l'élément modale
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    `;

    // Créer l'image en taille réelle
    const fullSizeImage = document.createElement('img');
    fullSizeImage.src = imageSrc;
    fullSizeImage.alt = altText;
    fullSizeImage.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        cursor: default;
    `;

    // Créer le bouton de fermeture
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 30px;
        background: none;
        border: none;
        color: white;
        font-size: 40px;
        cursor: pointer;
        z-index: 1001;
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: color 0.3s ease;
    `;

    // Ajouter les événements
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto'; // Réactiver le scroll
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        }
    });

    // Empêcher la fermeture quand on clique sur l'image
    fullSizeImage.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Gérer la touche Échap
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleKeyDown);
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Ajouter les éléments à la modale
    modal.appendChild(fullSizeImage);
    modal.appendChild(closeButton);

    // Ajouter la modale au body et désactiver le scroll
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
    // Sélectionner toutes les images de la galerie
    const galleryImages = document.querySelectorAll('.contener img');

    galleryImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function () {
            showImageModal(this.src, this.alt);
        });
    });
});