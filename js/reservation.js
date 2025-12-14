// Constantes pour les messages
const MESSAGES = {
    SUCCESS: 'Merci ! Redirection vers votre invitation...',
    ERROR_SINGLE: 'Veuillez entrer votre nom complet (minimum 2 caractères)',
    ERROR_COUPLE: 'Veuillez entrer les noms des deux personnes'
};

// Gestionnaire de réservation simplifié
class ReservationManager {
    constructor() {
        this.reservationType = 'seul'; // Valeur par défaut
        this.init();
    }

    // Initialisation
    init() {
        console.log('🚀 Initialisation du gestionnaire de réservation...');
        this.setupEventListeners();
        this.updateFormLabels(); // Initialiser les labels
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

        // Écouteurs pour les options de réservation
        const optionSeul = document.getElementById('option-seul');
        const optionCouple = document.getElementById('option-couple');

        if (optionSeul) {
            optionSeul.addEventListener('change', (event) => {
                if (event.target.checked) {
                    this.reservationType = 'seul';
                    this.updateFormLabels();
                }
            });
        }

        if (optionCouple) {
            optionCouple.addEventListener('change', (event) => {
                if (event.target.checked) {
                    this.reservationType = 'couple';
                    this.updateFormLabels();
                }
            });
        }

        // Récupérer le type sélectionné au chargement
        const selectedOption = document.querySelector('input[name="reservation-type"]:checked');
        if (selectedOption) {
            this.reservationType = selectedOption.value;
        }
    }

    // Mettre à jour les labels et placeholders selon le type
    updateFormLabels() {
        const nameLabel = document.getElementById('name-label');
        const nameInput = document.getElementById('name');
        const nameHint = document.getElementById('name-hint');

        if (this.reservationType === 'couple') {
            if (nameLabel) nameLabel.textContent = 'Noms du couple *';
            if (nameInput) nameInput.placeholder = 'Ex: Jean & Marie Kayembe';
            if (nameHint) nameHint.textContent = 'Veuillez entrer les prénoms des deux personnes + le nom de famille';
        } else {
            if (nameLabel) nameLabel.textContent = 'Nom & prénom *';
            if (nameInput) nameInput.placeholder = 'Votre nom et prénom';
            if (nameHint) nameHint.textContent = 'Veuillez entrer votre vrai nom et prénom';
        }
    }

    // Gérer la soumission du formulaire
    handleFormSubmit() {
        const nameInput = document.getElementById('name');
        const name = nameInput ? nameInput.value.trim() : '';

        // Validation simple selon le type
        if (!this.validateName(name)) {
            const errorMessage = this.reservationType === 'couple'
                ? MESSAGES.ERROR_COUPLE
                : MESSAGES.ERROR_SINGLE;
            this.showError(errorMessage);
            if (nameInput) nameInput.focus();
            return;
        }

        // Sauvegarder les données
        this.saveReservationData(name);

        // Afficher un message de succès
        this.showSuccess(name);

        // Redirection après un court délai
        setTimeout(() => {
            window.location.href = 'invitation.html';
        }, 2000);
    }

    // Valider le nom selon le type (validation simplifiée)
    validateName(name) {
        // Validation de base pour tous les types
        if (!name || name.length < 2) return false;

        // Pour tous les types, accepter tout format de nom
        // On ne vérifie plus la présence de "&" ou "et"
        return true;
    }

    // Sauvegarder les données de réservation
    saveReservationData(name) {
        try {
            const reservationData = {
                nom: name,
                type: this.reservationType,
                date: new Date().toISOString(),
                timestamp: Date.now(),
                // Ajout d'un identifiant unique pour plus de fiabilité
                reservationId: 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };

            console.log('📝 Données à sauvegarder:', reservationData);

            // Sauvegarder dans sessionStorage (prioritaire)
            sessionStorage.setItem('reservationData', JSON.stringify(reservationData));
            console.log('✅ Données sauvegardées dans sessionStorage');

            // Sauvegarder dans localStorage (pour persistance)
            localStorage.setItem('reservationData', JSON.stringify(reservationData));
            localStorage.setItem('inviteName', name);
            localStorage.setItem('reservationType', this.reservationType);
            localStorage.setItem('reservationTimestamp', Date.now().toString());

            console.log('✅ Données sauvegardées dans localStorage');
            console.log('📋 Contenu localStorage:', {
                inviteName: localStorage.getItem('inviteName'),
                reservationType: localStorage.getItem('reservationType'),
                reservationData: localStorage.getItem('reservationData')
            });

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

        // Message personnalisé selon le type
        const successMessage = this.reservationType === 'couple'
            ? `Merci ${name} pour votre réservation en couple !`
            : `Merci ${name} !`;

        // Afficher le message de succès
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.innerHTML = `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">🎉</div>
                    <h3 style="color: #4CAF50; margin-bottom: 10px;">${successMessage}</h3>
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