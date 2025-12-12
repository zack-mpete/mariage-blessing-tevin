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

    // Ajouter aussi la possibilité d'envoyer avec Entrée dans le textarea (Ctrl+Enter)
    messageTextarea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            envoyerMessageWhatsApp();
        }
    });

    console.log('Livre d\'or initialisé');
}

// Système de notifications amélioré
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notificationQueue = [];
        this.isShowing = false;
        this.initContainer();
    }

    initContainer() {
        // Créer le conteneur de notifications
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    showNotification(options) {
        const notification = {
            id: Date.now() + Math.random(),
            type: options.type || 'info',
            title: options.title || '',
            message: options.message || '',
            duration: options.duration || 5000,
            icon: options.icon || this.getIconByType(options.type),
            onClose: options.onClose || null,
            showCloseButton: options.showCloseButton !== false
        };

        this.notificationQueue.push(notification);
        this.processQueue();

        return notification.id;
    }

    getIconByType(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            whatsapp: '📱'
        };
        return icons[type] || icons.info;
    }

    createNotificationElement(notification) {
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.type}`;
        notificationEl.dataset.id = notification.id;

        // Style de base de la notification
        notificationEl.style.cssText = `
            background: ${this.getBackgroundColor(notification.type)};
            color: ${this.getTextColor(notification.type)};
            padding: 16px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
            pointer-events: auto;
            position: relative;
            overflow: hidden;
            border-left: 4px solid ${this.getBorderColor(notification.type)};
            max-width: 100%;
            backdrop-filter: blur(10px);
        `;

        // Ajouter un effet de brillance
        const shine = document.createElement('div');
        shine.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            animation: shine 2s infinite;
        `;

        // Icone
        const iconEl = document.createElement('div');
        iconEl.className = 'notification-icon';
        iconEl.style.cssText = `
            font-size: 24px;
            flex-shrink: 0;
            margin-top: 2px;
        `;
        iconEl.textContent = notification.icon;

        // Contenu
        const contentEl = document.createElement('div');
        contentEl.className = 'notification-content';
        contentEl.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        if (notification.title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'notification-title';
            titleEl.style.cssText = `
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 4px;
                font-family: "Lucida Calligraphy", cursive;
            `;
            titleEl.textContent = notification.title;
            contentEl.appendChild(titleEl);
        }

        const messageEl = document.createElement('div');
        messageEl.className = 'notification-message';
        messageEl.style.cssText = `
            font-size: 14px;
            line-height: 1.5;
            font-family: Arial, sans-serif;
        `;
        messageEl.textContent = notification.message;
        contentEl.appendChild(messageEl);

        // Bouton de fermeture
        if (notification.showCloseButton) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
                flex-shrink: 0;
                padding: 0;
                margin-left: 10px;
                line-height: 1;
            `;
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => {
                this.removeNotification(notification.id);
                if (notification.onClose) notification.onClose();
            });
            notificationEl.appendChild(closeBtn);
        }

        // Assembler les éléments
        notificationEl.appendChild(shine);
        notificationEl.appendChild(iconEl);
        notificationEl.appendChild(contentEl);

        // Fermeture automatique
        if (notification.duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, notification.duration);
        }

        return notificationEl;
    }

    getBackgroundColor(type) {
        const colors = {
            success: 'rgba(76, 175, 80, 0.95)',
            error: 'rgba(244, 67, 54, 0.95)',
            warning: 'rgba(255, 152, 0, 0.95)',
            info: 'rgba(33, 150, 243, 0.95)',
            whatsapp: 'rgba(37, 211, 102, 0.95)'
        };
        return colors[type] || colors.info;
    }

    getTextColor(type) {
        return 'white';
    }

    getBorderColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3',
            whatsapp: '#128C7E'
        };
        return colors[type] || colors.info;
    }

    processQueue() {
        if (this.isShowing || this.notificationQueue.length === 0) return;

        this.isShowing = true;
        const notification = this.notificationQueue.shift();
        const element = this.createNotificationElement(notification);

        this.container.appendChild(element);

        // Animation d'entrée
        setTimeout(() => {
            element.style.animation = 'none';
            setTimeout(() => {
                element.style.animation = '';
            }, 10);
        }, 300);

        // Préparer la notification suivante
        setTimeout(() => {
            this.isShowing = false;
            this.processQueue();
        }, 300);
    }

    removeNotification(id) {
        const element = this.container.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (element.parentNode === this.container) {
                    this.container.removeChild(element);
                }
            }, 300);
        }
    }

    clearAll() {
        const elements = this.container.querySelectorAll('.notification');
        elements.forEach(el => {
            el.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (el.parentNode === this.container) {
                    this.container.removeChild(el);
                }
            }, 300);
        });
        this.notificationQueue = [];
        this.isShowing = false;
    }
}

// Initialiser le système de notifications
const notifications = new NotificationSystem();

// Ajouter les styles d'animation
function addNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes shine {
                0% {
                    left: -100%;
                }
                50% {
                    left: 100%;
                }
                100% {
                    left: 100%;
                }
            }
            
            .notification:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .notification-close:hover {
                opacity: 1 !important;
                transform: scale(1.2);
                transition: opacity 0.2s, transform 0.2s;
            }
        `;
        document.head.appendChild(style);
    }
}

// Fonction pour envoyer le message via WhatsApp avec notifications
function envoyerMessageWhatsApp() {
    try {
        // Récupérer les valeurs
        const nomInput = document.querySelector('.livreDor input[type="text"]');
        const messageTextarea = document.querySelector('.livreDor textarea');
        const sendButton = document.querySelector('.livreDor button');

        if (!nomInput || !messageTextarea || !sendButton) {
            notifications.showNotification({
                type: 'error',
                title: 'Erreur',
                message: 'Les champs du livre d\'or ne sont pas disponibles',
                duration: 4000
            });
            return;
        }

        const nom = nomInput.value.trim();
        const message = messageTextarea.value.trim();

        // Validation
        if (!nom) {
            notifications.showNotification({
                type: 'warning',
                title: 'Champ requis',
                message: 'Veuillez entrer votre nom',
                duration: 3000
            });
            nomInput.focus();
            return;
        }

        if (!message) {
            notifications.showNotification({
                type: 'warning',
                title: 'Champ requis',
                message: 'Veuillez entrer un message',
                duration: 3000
            });
            messageTextarea.focus();
            return;
        }

        if (nom.length < 2) {
            notifications.showNotification({
                type: 'warning',
                title: 'Nom trop court',
                message: 'Le nom doit contenir au moins 2 caractères',
                duration: 3000
            });
            nomInput.focus();
            return;
        }

        if (message.length < 5) {
            notifications.showNotification({
                type: 'warning',
                title: 'Message trop court',
                message: 'Le message doit contenir au moins 5 caractères',
                duration: 3000
            });
            messageTextarea.focus();
            return;
        }

        // Afficher une notification de préparation
        const preparingId = notifications.showNotification({
            type: 'whatsapp',
            title: 'Préparation du message',
            message: 'Votre message est en cours de préparation...',
            duration: 2000,
            showCloseButton: false
        });

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

        // Afficher une notification de confirmation
        setTimeout(() => {
            notifications.removeNotification(preparingId);

            const confirmationId = notifications.showNotification({
                type: 'info',
                title: 'Confirmation requise',
                message: 'Voulez-vous ouvrir WhatsApp pour envoyer votre message ?',
                duration: 0, // Pas de fermeture automatique
                showCloseButton: true,
                onClose: () => {
                    // Si l'utilisateur ferme la notification sans agir
                    sendButton.textContent = 'Envoyer';
                    sendButton.disabled = false;
                }
            });

            // Créer des boutons d'action dans la notification
            setTimeout(() => {
                const notificationEl = document.querySelector(`[data-id="${confirmationId}"]`);
                if (notificationEl) {
                    const actionsDiv = document.createElement('div');
                    actionsDiv.style.cssText = `
                        display: flex;
                        gap: 10px;
                        margin-top: 10px;
                    `;

                    // Bouton Oui
                    const yesBtn = document.createElement('button');
                    yesBtn.textContent = 'Oui, ouvrir WhatsApp';
                    yesBtn.style.cssText = `
                        background: white;
                        color: #25d366;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 5px;
                        font-size: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        flex: 1;
                        transition: all 0.2s;
                        font-family: Arial, sans-serif;
                    `;
                    yesBtn.addEventListener('mouseover', () => {
                        yesBtn.style.backgroundColor = '#f0f0f0';
                    });
                    yesBtn.addEventListener('mouseout', () => {
                        yesBtn.style.backgroundColor = 'white';
                    });
                    yesBtn.addEventListener('click', () => {
                        notifications.removeNotification(confirmationId);

                        // Afficher notification de chargement
                        const loadingId = notifications.showNotification({
                            type: 'whatsapp',
                            title: 'Ouverture en cours',
                            message: 'Redirection vers WhatsApp...',
                            duration: 1500,
                            showCloseButton: false
                        });

                        // Mettre à jour le bouton
                        sendButton.textContent = '📱 Ouverture...';
                        sendButton.disabled = true;

                        setTimeout(() => {
                            notifications.removeNotification(loadingId);

                            // Ouvrir WhatsApp
                            const newWindow = window.open(whatsappUrl, '_blank');

                            if (!newWindow) {
                                notifications.showNotification({
                                    type: 'error',
                                    title: 'Pop-up bloqué',
                                    message: 'Veuillez autoriser les pop-ups pour ouvrir WhatsApp',
                                    duration: 5000
                                });
                                sendButton.textContent = 'Envoyer';
                                sendButton.disabled = false;
                                return;
                            }

                            // Notification de succès
                            notifications.showNotification({
                                type: 'success',
                                title: 'Message préparé !',
                                message: 'Vérifiez WhatsApp pour envoyer votre message',
                                duration: 5000
                            });

                            // Réinitialiser le formulaire
                            nomInput.value = '';
                            messageTextarea.value = '';

                            // Mettre à jour le bouton
                            sendButton.textContent = '✅ Envoyé !';

                            // Réinitialiser après 3 secondes
                            setTimeout(() => {
                                sendButton.textContent = 'Envoyer';
                                sendButton.disabled = false;

                                // Notification de rappel
                                notifications.showNotification({
                                    type: 'info',
                                    title: 'Merci !',
                                    message: 'Votre message a été envoyé avec succès',
                                    duration: 3000
                                });
                            }, 3000);

                        }, 500);
                    });

                    // Bouton Non
                    const noBtn = document.createElement('button');
                    noBtn.textContent = 'Annuler';
                    noBtn.style.cssText = `
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        padding: 6px 12px;
                        border-radius: 5px;
                        font-size: 12px;
                        cursor: pointer;
                        flex: 1;
                        transition: all 0.2s;
                        font-family: Arial, sans-serif;
                    `;
                    noBtn.addEventListener('mouseover', () => {
                        noBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                    });
                    noBtn.addEventListener('mouseout', () => {
                        noBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    });
                    noBtn.addEventListener('click', () => {
                        notifications.removeNotification(confirmationId);
                        notifications.showNotification({
                            type: 'info',
                            title: 'Annulé',
                            message: 'L\'envoi a été annulé',
                            duration: 2000
                        });
                        sendButton.textContent = 'Envoyer';
                        sendButton.disabled = false;
                    });

                    actionsDiv.appendChild(yesBtn);
                    actionsDiv.appendChild(noBtn);

                    const contentEl = notificationEl.querySelector('.notification-content');
                    if (contentEl) {
                        contentEl.appendChild(actionsDiv);
                    }
                }
            }, 100);

        }, 500);

    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        notifications.showNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Une erreur est survenue. Veuillez réessayer.',
            duration: 4000
        });

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
        nomInput.style.cssText = `
            padding: 10px;
            border: 2px solid #F7E7CE;
            border-radius: 8px;
            font-size: 14px;
            font-family: Arial, sans-serif;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.3s;
        `;
        nomInput.addEventListener('focus', () => {
            nomInput.style.borderColor = '#8B0000';
        });
        nomInput.addEventListener('blur', () => {
            nomInput.style.borderColor = '#F7E7CE';
        });
    }

    if (messageTextarea && !messageTextarea.getAttribute('placeholder')) {
        messageTextarea.placeholder = 'Votre message de félicitations...';
        messageTextarea.style.cssText = `
            padding: 10px;
            border: 2px solid #F7E7CE;
            border-radius: 8px;
            font-size: 14px;
            font-family: Arial, sans-serif;
            width: 100%;
            min-height: 120px;
            resize: vertical;
            box-sizing: border-box;
            transition: border-color 0.3s;
        `;
        messageTextarea.addEventListener('focus', () => {
            messageTextarea.style.borderColor = '#8B0000';
        });
        messageTextarea.addEventListener('blur', () => {
            messageTextarea.style.borderColor = '#F7E7CE';
        });
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
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const countSpan = document.createElement('span');
        const hintSpan = document.createElement('span');
        hintSpan.textContent = 'Ctrl+Enter pour envoyer';
        hintSpan.style.cssText = `
            font-size: 11px;
            color: #999;
            font-style: italic;
        `;

        counterDiv.appendChild(hintSpan);
        counterDiv.appendChild(countSpan);

        messageTextarea.parentNode.appendChild(counterDiv);

        messageTextarea.addEventListener('input', function () {
            const count = this.value.length;
            countSpan.textContent = `${count} caractères`;

            if (count > 500) {
                countSpan.style.color = '#8B0000';
                notifications.showNotification({
                    type: 'warning',
                    title: 'Message long',
                    message: 'Votre message est très long. WhatsApp pourrait le tronquer.',
                    duration: 3000
                });
            } else if (count > 300) {
                countSpan.style.color = '#FFA500';
            } else {
                countSpan.style.color = '#666';
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
            padding: 14px 28px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
            font-family: "Lucida Calligraphy", cursive;
            position: relative;
            overflow: hidden;
            width: 100%;
        `;

        // Effet de brillance sur le bouton
        const buttonShine = document.createElement('div');
        buttonShine.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s;
        `;
        sendButton.appendChild(buttonShine);

        sendButton.addEventListener('mouseover', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 20px rgba(37, 211, 102, 0.4)';
            buttonShine.style.left = '100%';
        });

        sendButton.addEventListener('mouseout', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
            buttonShine.style.left = '-100%';
        });

        // Animation au clic
        sendButton.addEventListener('mousedown', function () {
            this.style.transform = 'translateY(1px)';
        });

        sendButton.addEventListener('mouseup', function () {
            this.style.transform = 'translateY(-2px)';
        });
    }

    // Ajouter un titre avec emoji
    const livreDorTitle = document.querySelector('.livreDor h1');
    if (livreDorTitle) {
        livreDorTitle.innerHTML = '📖 Livre d\'or';
        livreDorTitle.style.cssText = `
            color: #8B0000;
            text-align: center;
            margin-bottom: 20px;
            font-family: "Lucida Calligraphy", cursive;
        `;
    }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initialisation de la page d\'accueil...');

    // Ajouter les styles de notification
    addNotificationStyles();

    // Initialiser le livre d'or
    initLivreDor();

    // Améliorer l'expérience utilisateur
    ameliorerUXLivreDor();

    // Afficher une notification de bienvenue
    setTimeout(() => {
        notifications.showNotification({
            type: 'info',
            title: 'Bienvenue !',
            message: 'Laissez un message dans notre livre d\'or. Il sera envoyé par WhatsApp.',
            duration: 5000
        });
    }, 1000);

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
        if (window.innerWidth > 768 && nav) {
            nav.style.display = 'flex';
        }
    });
});

// Exposer le système de notifications globalement (pour débogage)
window.notifications = notifications;

// Fonction pour tester le système de notifications
function testNotifications() {
    notifications.showNotification({
        type: 'success',
        title: 'Test de succès',
        message: 'Ceci est une notification de test réussie !',
        duration: 3000
    });

    setTimeout(() => {
        notifications.showNotification({
            type: 'error',
            title: 'Test d\'erreur',
            message: 'Ceci est une notification d\'erreur de test !',
            duration: 3000
        });
    }, 500);

    setTimeout(() => {
        notifications.showNotification({
            type: 'warning',
            title: 'Test d\'avertissement',
            message: 'Ceci est une notification d\'avertissement de test !',
            duration: 3000
        });
    }, 1000);

    setTimeout(() => {
        notifications.showNotification({
            type: 'whatsapp',
            title: 'Test WhatsApp',
            message: 'Ceci est une notification WhatsApp de test !',
            duration: 3000
        });
    }, 1500);
}

// Fonction pour tester l'envoi de message
function testEnvoiMessage() {
    const nomInput = document.querySelector('.livreDor input[type="text"]');
    const messageTextarea = document.querySelector('.livreDor textarea');

    if (nomInput && messageTextarea) {
        nomInput.value = 'Visiteur Test';
        messageTextarea.value = 'Je tenais à vous féliciter pour votre mariage ! Que Dieu bénisse votre union. C\'est un message test pour vérifier le système.';
        messageTextarea.dispatchEvent(new Event('input'));

        notifications.showNotification({
            type: 'info',
            title: 'Test',
            message: 'Champs remplis pour test. Cliquez sur "Envoyer" pour continuer.',
            duration: 3000
        });
    }
}

// Exposer les fonctions de test (à commenter en production)
// window.testNotifications = testNotifications;
// window.testEnvoiMessage = testEnvoiMessage;