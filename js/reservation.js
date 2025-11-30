// Constantes pour les messages et les URLs
const MESSAGES = {
    FIELDS_REQUIRED: 'Veuillez remplir tous les champs correctement',
    INVALID_PHONE: 'Le numéro de téléphone doit contenir au moins 10 chiffres',
    LOADING: 'Veuillez patienter...',
    ALREADY_REGISTERED: 'Vous avez déjà réservé votre place.',
    NOT_FOUND: 'Invitation non trouvée. Veuillez vérifier vos informations.',
    ERROR_LOADING: 'Une erreur est survenue lors de la vérification de votre invitation. Veuillez réessayer plus tard.'
};

const ROUTES = {
    INDEX: 'index.html',
    INVITATION: 'invitation.html',
    API: 'api/api.json'
};

// Fonction utilitaire pour afficher les messages d'erreur
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Fonction pour valider le numéro de téléphone
function validatePhoneNumber(phone) {
    const phoneRegex = /^[0-9]{10,}$/;
    return phoneRegex.test(phone);
}

// Fonction pour réinitialiser le formulaire
function resetForm(button) {
    if (button) {
        button.textContent = 'Vérifier mon invitation';
        button.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('reservation-form');
    const submitButton = document.getElementById('submit-button');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (!form || !submitButton) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const numeroSaisi = document.getElementById('number').value.trim();
        const nomSaisi = document.getElementById('name').value.trim();

        // Validation du champ numéro de téléphone
        if (!numeroSaisi) {
            showError('Veuillez entrer un numéro de téléphone');
            return;
        }

        // Validation du format du numéro de téléphone
        if (!validatePhoneNumber(numeroSaisi)) {
            showError(MESSAGES.INVALID_PHONE);
            return;
        }

        // Afficher l'indicateur de chargement
        submitButton.disabled = true;
        submitButton.textContent = MESSAGES.LOADING;
        if (loadingIndicator) loadingIndicator.style.display = 'block';

        try {
            console.log('Début de la vérification de l\'invitation...');
            console.log('Numéro saisi:', numeroSaisi);
            console.log('Nom saisi:', nomSaisi);

            const response = await fetch(ROUTES.API);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('Données de l\'API:', JSON.stringify(data, null, 2));

            // Normalisation du numéro saisi pour la comparaison
            const numeroSaisiNormalise = numeroSaisi.replace(/\D/g, '');

            // Recherche de l'invité par numéro de téléphone uniquement
            const inviteTrouve = data.invites.find(invite => {
                const portableNormalise = invite.portable.replace(/\D/g, '');
                const correspondance = portableNormalise === numeroSaisiNormalise;

                console.log('Comparaison numéro:', {
                    'invite.portable': invite.portable,
                    'portableNormalise': portableNormalise,
                    'numeroSaisiNormalise': numeroSaisiNormalise,
                    'correspondance': correspondance
                });

                return correspondance;
            });

            console.log('Résultat de la recherche:', inviteTrouve ? 'Trouvé' : 'Non trouvé');

            if (inviteTrouve) {
                if (!inviteTrouve.enregistrer) {
                    // Stocker les informations de l'invité pour la page suivante
                    sessionStorage.setItem('inviteData', JSON.stringify(inviteTrouve));
                    window.location.href = ROUTES.INVITATION;
                } else {
                    showError(MESSAGES.ALREADY_REGISTERED);
                    setTimeout(() => {
                        window.location.href = ROUTES.INDEX;
                    }, 3000);
                }
            } else {
                showError(MESSAGES.NOT_FOUND);
                resetForm(submitButton);
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'invitation:', error);
            showError(MESSAGES.ERROR_LOADING);
            resetForm(submitButton);
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    });
});