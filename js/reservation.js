// Constantes pour les messages
const MESSAGES = {
    SUCCESS: 'Merci ! Redirection vers votre invitation...',
    ERROR: 'Veuillez entrer votre nom complet (minimum 2 caractères)'
};

// Gestionnaire de réservation simplifié
class ReservationManager {
    constructor() {
        this.init();
    }

    // Initialisation
    init() {
        console.log('🚀 Initialisation du gestionnaire de réservation...');
        this.setupEventListeners();
    }

    // Configurer les écouteurs d'événements
    setupEventListeners() {
        const form = document.getElementById('reservation-form');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    // Gérer la soumission du formulaire
    handleFormSubmit() {
        const nameInput = document.getElementById('name');
        const name = nameInput ? nameInput.value.trim() : '';

        // Validation
        if (!this.validateName(name)) {
            this.showError(MESSAGES.ERROR);
            if (nameInput) nameInput.focus();
            return;
        }

        // Sauvegarder le nom dans le stockage local et la session
        this.saveReservationData(name);

        // Afficher un message de succès
        this.showSuccess(name);

        // Redirection après un court délai
        setTimeout(() => {
            window.location.href = 'invitation.html';
        }, 2000);
    }

    // Valider le nom
    validateName(name) {
        return name && name.length >= 2;
    }

    // Sauvegarder les données de réservation
    saveReservationData(name) {
        try {
            const reservationData = {
                nom: name,
                date: new Date().toISOString(),
                timestamp: Date.now()
            };

            // Sauvegarder dans sessionStorage (pour la récupération immédiate)
            sessionStorage.setItem('reservationData', JSON.stringify(reservationData));

            // Sauvegarder dans localStorage (pour persistance)
            localStorage.setItem('inviteName', name);

            console.log('📝 Données sauvegardées:', reservationData);
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
    }

    // Afficher message d'erreur
    showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';

            // Masquer après 5 secondes
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }

    // Afficher message de succès
    showSuccess(name) {
        // Masquer d'abord les messages d'erreur
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        // Afficher le message de succès
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.innerHTML = `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">🎉</div>
                    <h3 style="color: #4CAF50; margin-bottom: 10px;">Merci ${name} !</h3>
                    <p style="color: #333; margin-bottom: 5px;">
                        ${MESSAGES.SUCCESS}
                    </p>
                </div>
            `;
            successDiv.style.display = 'block';
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Page de réservation chargée');

    // Menu mobile
    const menuIcon = document.querySelector('.menuIcon');
    if (menuIcon) {
        menuIcon.addEventListener('click', function () {
            const nav = document.querySelector('nav ul');
            if (nav) {
                nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            }
        });
    }

    // Ajuster la navigation pour mobile
    window.addEventListener('resize', function () {
        const nav = document.querySelector('nav ul');
        if (nav && window.innerWidth > 768) {
            nav.style.display = 'flex';
        }
    });

    // Initialiser le gestionnaire de réservation
    new ReservationManager();
});