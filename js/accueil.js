// Fonction pour initialiser le livre d'or
function initLivreDor() {
    console.log('Initialisation du livre d\'or...');

    // Récupérer les éléments
    const nomInput = document.querySelector('.livreDor input[type="text"]');
    const messageTextarea = document.querySelector('.livreDor textarea');
    const sendButton = document.querySelector('.livreDor button');

    if (!nomInput || !messageTextarea || !sendButton) {
        console.error('Éléments du livre d\'or non trouvés');
        return;
    }

    // Ajouter l'événement au bouton
    sendButton.addEventListener('click', function (e) {
        e.preventDefault();
        envoyerMessageWhatsApp();
    });

    // Ajouter aussi la possibilité d'envoyer avec Entrée dans le textarea
    messageTextarea.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            envoyerMessageWhatsApp();
        }
    });

    console.log('Livre d\'or initialisé');
}

// Fonction pour envoyer le message via WhatsApp
function envoyerMessageWhatsApp() {
    try {
        // Récupérer les valeurs
        const nomInput = document.querySelector('.livreDor input[type="text"]');
        const messageTextarea = document.querySelector('.livreDor textarea');

        if (!nomInput || !messageTextarea) {
            alert('Les champs du livre d\'or ne sont pas disponibles');
            return;
        }

        const nom = nomInput.value.trim();
        const message = messageTextarea.value.trim();

        // Validation
        if (!nom) {
            alert('Veuillez entrer votre nom');
            nomInput.focus();
            return;
        }

        if (!message) {
            alert('Veuillez entrer un message');
            messageTextarea.focus();
            return;
        }

        if (nom.length < 2) {
            alert('Le nom doit contenir au moins 2 caractères');
            nomInput.focus();
            return;
        }

        if (message.length < 5) {
            alert('Le message doit contenir au moins 5 caractères');
            messageTextarea.focus();
            return;
        }

        // Numéro WhatsApp (format international)
        const phoneNumber = '243829225086'; // +243 82 922 5086

        // Construire le message
        const whatsappMessage =
            `🎉 *NOUVEAU MESSAGE DU LIVRE D'OR* 🎉\n\n` +
            `👤 *Nom*: ${nom}\n\n` +
            `💌 *Message*:\n${message}\n\n` +
            `📅 *Date*: ${new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}\n\n` +
            `💍 *Mariage de Blessing & Tevin*`;

        // Encoder le message pour URL
        const encodedMessage = encodeURIComponent(whatsappMessage);

        // Créer l'URL WhatsApp
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        // Afficher une confirmation avant envoi
        if (confirm('Voulez-vous envoyer ce message via WhatsApp ?')) {
            // Afficher un indicateur de chargement
            const sendButton = document.querySelector('.livreDor button');
            const originalText = sendButton.textContent;
            sendButton.textContent = 'Envoi en cours...';
            sendButton.disabled = true;

            // Ouvrir WhatsApp
            const newWindow = window.open(whatsappUrl, '_blank');

            if (!newWindow) {
                alert('Veuillez autoriser les pop-ups pour ouvrir WhatsApp');
                sendButton.textContent = originalText;
                sendButton.disabled = false;
                return;
            }

            // Réinitialiser le formulaire après un délai
            setTimeout(() => {
                nomInput.value = '';
                messageTextarea.value = '';
                sendButton.textContent = '✅ Envoyé !';

                // Réinitialiser le bouton après 2 secondes
                setTimeout(() => {
                    sendButton.textContent = originalText;
                    sendButton.disabled = false;
                }, 2000);
            }, 1000);

            // Afficher un message de succès
            setTimeout(() => {
                alert('Votre message a été préparé pour WhatsApp. Veuillez vérifier votre application WhatsApp pour l\'envoyer.');
            }, 1500);

        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        alert('Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.');

        // Réinitialiser le bouton en cas d'erreur
        const sendButton = document.querySelector('.livreDor button');
        if (sendButton) {
            sendButton.textContent = 'Envoyer';
            sendButton.disabled = false;
        }
    }
}

// Fonction pour améliorer l'expérience utilisateur
function ameliorerUXLivreDor() {
    // Ajouter des placeholders si nécessaire
    const nomInput = document.querySelector('.livreDor input[type="text"]');
    const messageTextarea = document.querySelector('.livreDor textarea');

    if (nomInput && !nomInput.getAttribute('placeholder')) {
        nomInput.placeholder = 'Votre nom...';
    }

    if (messageTextarea && !messageTextarea.getAttribute('placeholder')) {
        messageTextarea.placeholder = 'Votre message de félicitations...';
    }

    // Ajouter un compteur de caractères
    if (messageTextarea) {
        const counterDiv = document.createElement('div');
        counterDiv.className = 'character-counter';
        counterDiv.style.cssText = `
            font-size: 12px;
            color: #666;
            text-align: right;
            margin-top: 5px;
            font-family: Arial, sans-serif;
        `;

        messageTextarea.parentNode.appendChild(counterDiv);

        messageTextarea.addEventListener('input', function () {
            const count = this.value.length;
            counterDiv.textContent = `${count} caractères`;

            if (count > 500) {
                counterDiv.style.color = '#8B0000';
            } else if (count > 300) {
                counterDiv.style.color = '#FFA500';
            } else {
                counterDiv.style.color = '#666';
            }
        });

        // Déclencher l'événement input pour initialiser le compteur
        messageTextarea.dispatchEvent(new Event('input'));
    }

    // Ajouter un style au bouton
    const sendButton = document.querySelector('.livreDor button');
    if (sendButton) {
        sendButton.style.cssText = `
            background: linear-gradient(135deg, #25d366, #128c7e);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
            font-family: "Lucida Calligraphy", cursive;
        `;

        sendButton.addEventListener('mouseover', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
        });

        sendButton.addEventListener('mouseout', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initialisation de la page d\'accueil...');

    // Initialiser le livre d'or
    initLivreDor();

    // Améliorer l'expérience utilisateur
    ameliorerUXLivreDor();

    // Menu mobile (conservé depuis votre code existant)
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
        if (window.innerWidth > 768 && nav) {
            nav.style.display = 'flex';
        }
    });
});

// Fonction pour tester l'envoi (utile pour le développement)
function testEnvoiMessage() {
    const nomInput = document.querySelector('.livreDor input[type="text"]');
    const messageTextarea = document.querySelector('.livreDor textarea');

    if (nomInput && messageTextarea) {
        nomInput.value = 'Test Nom';
        messageTextarea.value = 'Ceci est un message test pour le livre d\'or du mariage de Blessing & Tevin !';
        console.log('Champs remplis pour test');
    }
}

// Exposer la fonction de test globalement (optionnel - à retirer en production)
// window.testLivreDor = testEnvoiMessage;