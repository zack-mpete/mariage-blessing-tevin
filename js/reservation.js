// Constantes pour les messages et les URLs
const MESSAGES = {
    FIELDS_REQUIRED: 'Veuillez remplir tous les champs correctement',
    MAX_SELECTIONS_REACHED: 'Maximum 2 boissons autorisées',
    MIN_SELECTIONS_REQUIRED: 'Veuillez sélectionner au moins une boisson'
};

const ROUTES = {
    INDEX: 'index.html',
    INVITATION: 'invitation.html'
};

// Constantes de configuration
const CONFIG = {
    MAX_SELECTIONS: 2,
    MIN_SELECTIONS: 1
};

// Gestionnaire de réservation
class ReservationManager {
    constructor() {
        // Données des boissons avec compteurs initiaux
        this.boissonsData = {
            alcool: [
                { name: "Castel", icon: "🍺", count: 0 },
                { name: "Beaufort", icon: "🍺", count: 0 },
                { name: "Primus", icon: "🍺", count: 0 },
                { name: "Tembo", icon: "🍺", count: 0 },
                { name: "Mutzig", icon: "🍺", count: 0 },
                { name: "Nkoyi", icon: "🍶", count: 0 },
                { name: "Likofi", icon: "🍶", count: 0 },
                { name: "Legend", icon: "🥃", count: 0 },
                { name: "Champagne", icon: "🍾", count: 0 },
                { name: "Vin", icon: "🍷", count: 0 }
            ],
            nonAlcool: [
                { name: "Coca", icon: "🥤", count: 0 },
                { name: "Fanta", icon: "🥤", count: 0 },
                { name: "Vitalo", icon: "🧃", count: 0 },
                { name: "Maltina", icon: "🧃", count: 0 },
                { name: "Energy Malt", icon: "⚡", count: 0 },
                { name: "Eau minérale", icon: "💧", count: 0 },
                { name: "Jus d'orange", icon: "🧃", count: 0 },
                { name: "Jus de mangue", icon: "🧃", count: 0 }
            ]
        };

        this.whatsappNumber = "0829225086"; // Numéro WhatsApp
        this.pendingCountsKey = 'pendingWhatsAppCounts'; // Clé pour les compteurs en attente
        this.preferencesCount = {};
        this.pendingCounts = {}; // Compteurs en attente d'envoi
        this.selectedCount = 0; // Compteur des sélections actuelles
        this.init();
    }

    // Initialisation
    async init() {
        await this.loadAllCounts(); // Charger tous les compteurs
        this.generateBoissonsGrid();
        this.setupEventListeners();
        this.createFloatingHearts();
        this.updateSelectionCounter();
    }

    // Charger tous les compteurs (actuels + en attente)
    async loadAllCounts() {
        console.log('Chargement de tous les compteurs');

        // 1. Initialiser les compteurs actuels à 0
        this.initializeAllCounts();

        // 2. Charger les compteurs en attente depuis localStorage
        await this.loadPendingCounts();

        // 3. Mettre à jour les données des boissons
        this.updateBoissonsDataCounts();
    }

    // Initialiser les compteurs de préférences
    async loadPreferencesCount() {
        console.log('Initialisation des compteurs de préférences à 0');
        this.initializeAllCounts();
    }

    // Initialiser tous les compteurs à 0
    initializeAllCounts() {
        const allBoissons = [...this.boissonsData.alcool, ...this.boissonsData.nonAlcool];
        allBoissons.forEach(boisson => {
            this.preferencesCount[boisson.name] = 0;
        });
    }

    // Charger les compteurs en attente
    async loadPendingCounts() {
        try {
            const pendingData = localStorage.getItem(this.pendingCountsKey);
            if (pendingData) {
                this.pendingCounts = JSON.parse(pendingData);
                console.log('Compteurs en attente chargés:', this.pendingCounts);

                // Fusionner avec les compteurs actuels
                Object.keys(this.pendingCounts).forEach(boissonName => {
                    this.preferencesCount[boissonName] =
                        (this.preferencesCount[boissonName] || 0) + this.pendingCounts[boissonName];
                });
            } else {
                this.pendingCounts = {};
                console.log('Aucun compteur en attente');
            }
        } catch (error) {
            console.error('Erreur chargement compteurs en attente:', error);
            this.pendingCounts = {};
        }
    }

    // Sauvegarder les compteurs en attente
    async savePendingCounts() {
        try {
            localStorage.setItem(this.pendingCountsKey, JSON.stringify(this.pendingCounts));
            console.log('Compteurs en attente sauvegardés:', this.pendingCounts);
        } catch (error) {
            console.error('Erreur sauvegarde compteurs en attente:', error);
        }
    }

    // Ajouter des compteurs en attente
    addToPendingCounts(selectedBoissons) {
        selectedBoissons.forEach(boissonName => {
            this.pendingCounts[boissonName] = (this.pendingCounts[boissonName] || 0) + 1;
        });

        this.savePendingCounts();
        console.log('Ajouté aux compteurs en attente:', selectedBoissons);
    }

    // Incrémenter les compteurs pour les boissons sélectionnées
    incrementSelectedCounts(selectedBoissons) {
        selectedBoissons.forEach(boissonName => {
            this.preferencesCount[boissonName] = (this.preferencesCount[boissonName] || 0) + 1;
            this.updateBoissonCount(boissonName, this.preferencesCount[boissonName]);
        });
    }

    // Mettre à jour le compteur d'une boisson spécifique
    updateBoissonCount(boissonName, newCount) {
        let boisson = this.boissonsData.alcool.find(b => b.name === boissonName);
        if (!boisson) {
            boisson = this.boissonsData.nonAlcool.find(b => b.name === boissonName);
        }
        if (boisson) {
            boisson.count = newCount;
        }
    }

    // Mettre à jour les compteurs dans boissonsData
    updateBoissonsDataCounts() {
        this.boissonsData.alcool.forEach(boisson => {
            boisson.count = this.preferencesCount[boisson.name] || 0;
        });

        this.boissonsData.nonAlcool.forEach(boisson => {
            boisson.count = this.preferencesCount[boisson.name] || 0;
        });
    }

    // Générer la grille des boissons avec compteurs
    generateBoissonsGrid() {
        const alcoolGrid = document.getElementById('alcool-grid');
        if (alcoolGrid) {
            alcoolGrid.innerHTML = '';
            this.boissonsData.alcool.forEach(boisson => {
                alcoolGrid.appendChild(this.createBoissonItem(boisson, 'alcool'));
            });
        }

        const nonAlcoolGrid = document.getElementById('non-alcool-grid');
        if (nonAlcoolGrid) {
            nonAlcoolGrid.innerHTML = '';
            this.boissonsData.nonAlcool.forEach(boisson => {
                nonAlcoolGrid.appendChild(this.createBoissonItem(boisson, 'non-alcool'));
            });
        }
    }

    // Créer un élément boisson avec compteur
    createBoissonItem(boisson, type) {
        const currentCount = this.preferencesCount[boisson.name] || 0;
        const pendingCount = this.pendingCounts[boisson.name] || 0;

        let displayText = `(${currentCount}`;
        if (pendingCount > 0) {
            displayText += ` +${pendingCount} en attente`;
        }
        displayText += `)`;

        const item = document.createElement('div');
        item.className = 'boisson-item';
        item.setAttribute('data-type', type);
        item.setAttribute('data-selected', 'false');
        item.innerHTML = `
            <div class="boisson-checkbox"></div>
            <span class="boisson-name">${boisson.icon} ${boisson.name}</span>
            <span class="boisson-count">${displayText}</span>
            <input type="checkbox" name="${type}" value="${boisson.name}" style="display: none;">
        `;

        // Ajouter un indicateur visuel pour les compteurs en attente
        if (pendingCount > 0) {
            item.querySelector('.boisson-count').style.color = '#FF9800';
            item.querySelector('.boisson-count').title = `${pendingCount} sélection(s) en attente d'envoi`;
        }

        item.addEventListener('click', () => this.toggleBoissonSelection(item));
        return item;
    }

    // Basculer la sélection d'une boisson avec limite
    toggleBoissonSelection(item) {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const isCurrentlySelected = checkbox.checked;

        // Si on essaie de désélectionner
        if (isCurrentlySelected) {
            checkbox.checked = false;
            item.classList.remove('selected');
            item.setAttribute('data-selected', 'false');
            this.selectedCount--;
            this.updateSelectionCounter();

            // Animation de désélection
            item.classList.add('confirmation-animation');
            setTimeout(() => {
                item.classList.remove('confirmation-animation');
            }, 300);

            this.updateSelectionSummary();
            return;
        }

        // Si on essaie de sélectionner mais que la limite est atteinte
        if (this.selectedCount >= CONFIG.MAX_SELECTIONS) {
            alert(MESSAGES.MAX_SELECTIONS_REACHED);

            // Animation d'alerte
            item.classList.add('warning-animation');
            setTimeout(() => {
                item.classList.remove('warning-animation');
            }, 500);

            return;
        }

        // Sélectionner normalement
        checkbox.checked = true;
        item.classList.add('selected');
        item.setAttribute('data-selected', 'true');
        this.selectedCount++;
        this.updateSelectionCounter();

        // Animation de sélection
        item.classList.add('confirmation-animation');
        setTimeout(() => {
            item.classList.remove('confirmation-animation');
        }, 300);

        this.updateSelectionSummary();
    }

    // Mettre à jour le compteur de sélections
    updateSelectionCounter() {
        const counterElement = document.getElementById('selection-counter');
        if (counterElement) {
            counterElement.textContent = `(${this.selectedCount}/${CONFIG.MAX_SELECTIONS})`;
            counterElement.style.color = this.selectedCount >= CONFIG.MAX_SELECTIONS ? '#d32f2f' : '#2e7d32';
        }
    }

    // Mettre à jour le résumé des sélections
    updateSelectionSummary() {
        const selectedItems = this.getSelectedBoissons();
        const summaryElement = document.getElementById('selection-summary');

        if (!summaryElement) return;

        if (selectedItems.length > 0) {
            summaryElement.innerHTML = `
                <div class="summary-title">
                    Vos sélections ${this.selectedCount}/${CONFIG.MAX_SELECTIONS}
                    <span id="selection-counter" style="color: ${this.selectedCount >= CONFIG.MAX_SELECTIONS ? '#d32f2f' : '#2e7d32'}; font-size: 0.9em; margin-left: 5px;">
                        (${this.selectedCount}/${CONFIG.MAX_SELECTIONS})
                    </span>
                </div>
                <div class="selection-list">
                    ${selectedItems.map(item => {
                const currentCount = this.preferencesCount[item] || 0;
                const pendingCount = this.pendingCounts[item] || 0;
                let displayText = `${item} <small>(${currentCount} actuellement`;
                if (pendingCount > 0) {
                    displayText += ` +${pendingCount} en attente`;
                }
                displayText += `)</small>`;
                return `<span class="selection-tag">${displayText}</span>`;
            }).join('')}
                </div>
            `;
            summaryElement.style.display = 'block';
        } else {
            summaryElement.innerHTML = `
                <div class="summary-title">
                    Vos sélections 0/${CONFIG.MAX_SELECTIONS}
                    <span id="selection-counter" style="color: #666; font-size: 0.9em; margin-left: 5px;">
                        (0/${CONFIG.MAX_SELECTIONS})
                    </span>
                </div>
                <div class="selection-list">
                    <span class="selection-tag empty">Aucune sélection</span>
                </div>
            `;
            summaryElement.style.display = 'block';
        }

        // Mettre à jour le compteur après la création du DOM
        this.updateSelectionCounter();
    }

    // Récupérer les boissons sélectionnées
    getSelectedBoissons() {
        const alcool = Array.from(document.querySelectorAll('input[name="alcool"]:checked'))
            .map(cb => cb.value);
        const nonAlcool = Array.from(document.querySelectorAll('input[name="non-alcool"]:checked'))
            .map(cb => cb.value);
        return [...alcool, ...nonAlcool];
    }

    // Configurer les écouteurs d'événements
    setupEventListeners() {
        const form = document.getElementById('reservation-form');
        if (form) {
            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const nameInput = document.getElementById('name');
                const name = nameInput ? nameInput.value.trim() : '';
                const selectedBoissons = this.getSelectedBoissons();

                console.log('Nom:', name, 'Sélections:', selectedBoissons);

                // Validation simple
                if (!name || name.length === 0) {
                    alert('Veuillez entrer votre nom et prénom');
                    if (nameInput) nameInput.focus();
                    return;
                }

                if (selectedBoissons.length === 0) {
                    alert('Veuillez sélectionner au moins une boisson');
                    return;
                }

                if (selectedBoissons.length > CONFIG.MAX_SELECTIONS) {
                    alert(`Maximum ${CONFIG.MAX_SELECTIONS} boissons autorisées`);
                    return;
                }

                // Sauvegarder les informations
                const reservationData = {
                    nom: name,
                    boissons: selectedBoissons,
                    date: new Date().toISOString()
                };

                // Sauvegarder dans sessionStorage
                sessionStorage.setItem('reservationData', JSON.stringify(reservationData));

                // Sauvegarder aussi dans localStorage
                localStorage.setItem('inviteName', name);
                localStorage.setItem('selectedBoissons', JSON.stringify(selectedBoissons));

                // Mettre à jour les compteurs actuels
                const oldCounts = {};
                selectedBoissons.forEach(boisson => {
                    oldCounts[boisson] = this.preferencesCount[boisson] || 0;
                });

                this.incrementSelectedCounts(selectedBoissons);
                this.updateCountersDisplay();

                // NOUVELLE LOGIQUE : Gestion WhatsApp intelligente
                await this.handleWhatsAppNotification(name, selectedBoissons, oldCounts);

                // Afficher message de confirmation
                this.showSuccess(`Merci ${name} ! Vos ${selectedBoissons.length} préférence(s) ont été enregistrées.`);
                this.createCelebrationHearts();

                // Redirection vers invitation.html après 2 secondes
                setTimeout(() => {
                    window.location.href = ROUTES.INVITATION;
                }, 2000);
            });
        }
    }

    // Gestion intelligente des notifications WhatsApp
    async handleWhatsAppNotification(name, selectedBoissons, oldCounts) {
        try {
            // 1. D'abord, essayer d'envoyer les compteurs en attente + nouvelle réservation
            const pendingSent = await this.sendPendingCountsViaWhatsApp(name);

            if (pendingSent) {
                // Si les compteurs en attente ont été envoyés, envoyer aussi la nouvelle réservation
                const newMessage = this.formatSingleReservationMessage(name, selectedBoissons, oldCounts);
                await this.sendSingleWhatsAppMessage(newMessage);
            } else {
                // 2. Si WhatsApp n'est pas disponible, ajouter aux compteurs en attente
                this.addToPendingCounts(selectedBoissons);

                // 3. Essayer quand même d'envoyer juste la nouvelle réservation
                const newMessage = this.formatSingleReservationMessage(name, selectedBoissons, oldCounts);
                await this.sendSingleWhatsAppMessage(newMessage);
            }
        } catch (error) {
            console.error('Erreur gestion WhatsApp:', error);
            // En cas d'erreur, ajouter aux compteurs en attente
            this.addToPendingCounts(selectedBoissons);
        }
    }

    // Envoyer les compteurs en attente via WhatsApp
    async sendPendingCountsViaWhatsApp(name) {
        if (Object.keys(this.pendingCounts).length === 0) {
            console.log('Aucun compteur en attente à envoyer');
            return false;
        }

        const date = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Préparer le message avec TOUS les compteurs en attente
        const message = `
🎉 COMPTEURS EN ATTENTE + NOUVELLE RÉSERVATION 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 DERNIER INVITÉ
• Nom: ${name}

📅 DATE
${date}

📊 COMPTEURS EN ATTENTE (avant cette réservation)
${Object.entries(this.pendingCounts)
                .map(([boisson, count]) => `• ${boisson}: ${count} personne${count > 1 ? 's' : ''}`)
                .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💝 Total des compteurs en attente: ${Object.values(this.pendingCounts).reduce((a, b) => a + b, 0)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();

        const cleanNumber = this.whatsappNumber.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

        try {
            // Essayer d'envoyer
            const success = await this.trySendWhatsApp(whatsappUrl);

            if (success) {
                // Si réussi, vider les compteurs en attente
                this.clearPendingCounts();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur envoi compteurs en attente:', error);
            return false;
        }
    }

    // Vider les compteurs en attente
    clearPendingCounts() {
        this.pendingCounts = {};
        localStorage.removeItem(this.pendingCountsKey);
        console.log('Compteurs en attente vidés');

        // Mettre à jour l'affichage
        this.updateCountersDisplay();
        this.updatePendingCountsBadge();
    }

    // Essayer d'envoyer via WhatsApp
    async trySendWhatsApp(url) {
        return new Promise((resolve) => {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;';
                iframe.src = url;
                document.body.appendChild(iframe);

                setTimeout(() => {
                    if (iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                    resolve(true);
                }, 1000);

                iframe.onerror = () => {
                    if (iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                    resolve(false);
                };
            } catch (error) {
                resolve(false);
            }
        });
    }

    // Formater message pour une seule réservation
    formatSingleReservationMessage(name, selectedBoissons, oldCounts) {
        const date = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
🎉 NOUVELLE RÉSERVATION DE BOISSONS 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 INVITÉ
• Nom: ${name}

📅 DATE
${date}

🍹 BOISSONS CHOISIES
${selectedBoissons.map(b => {
            const currentCount = this.preferencesCount[b] || 0;
            const oldCount = oldCounts[b] || 0;
            return `• ${b}: ${oldCount} → ${currentCount} personne${currentCount > 1 ? 's' : ''}`;
        }).join('\n')}

📊 RÉSUMÉ
${selectedBoissons.length} boisson${selectedBoissons.length > 1 ? 's' : ''} sélectionnée${selectedBoissons.length > 1 ? 's' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💝 Merci pour votre participation !
Blessing & Tevin ❤️
        `.trim();
    }

    // Envoyer un message WhatsApp simple
    async sendSingleWhatsAppMessage(message) {
        const cleanNumber = this.whatsappNumber.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

        return await this.trySendWhatsApp(whatsappUrl);
    }

    // Mettre à jour l'affichage des compteurs (inclure les en attente)
    updateCountersDisplay() {
        document.querySelectorAll('#alcool-grid .boisson-item').forEach(item => {
            const boissonName = item.querySelector('.boisson-name').textContent.replace(/[^a-zA-Z\s]/g, '').trim();
            const countElement = item.querySelector('.boisson-count');
            const currentCount = this.preferencesCount[boissonName] || 0;
            const pendingCount = this.pendingCounts[boissonName] || 0;

            if (countElement) {
                let displayText = `(${currentCount}`;
                if (pendingCount > 0) {
                    displayText += ` +${pendingCount} en attente`;
                }
                displayText += `)`;
                countElement.textContent = displayText;

                // Ajouter un indicateur visuel pour les compteurs en attente
                if (pendingCount > 0) {
                    countElement.style.color = '#FF9800'; // Orange pour indiquer l'attente
                    countElement.title = `${pendingCount} sélection(s) en attente d'envoi`;
                } else {
                    countElement.style.color = ''; // Réinitialiser la couleur
                    countElement.title = '';
                }
            }
        });

        document.querySelectorAll('#non-alcool-grid .boisson-item').forEach(item => {
            const boissonName = item.querySelector('.boisson-name').textContent.replace(/[^a-zA-Z\s]/g, '').trim();
            const countElement = item.querySelector('.boisson-count');
            const currentCount = this.preferencesCount[boissonName] || 0;
            const pendingCount = this.pendingCounts[boissonName] || 0;

            if (countElement) {
                let displayText = `(${currentCount}`;
                if (pendingCount > 0) {
                    displayText += ` +${pendingCount} en attente`;
                }
                displayText += `)`;
                countElement.textContent = displayText;

                if (pendingCount > 0) {
                    countElement.style.color = '#FF9800';
                    countElement.title = `${pendingCount} sélection(s) en attente d'envoi`;
                } else {
                    countElement.style.color = '';
                    countElement.title = '';
                }
            }
        });

        // Afficher un badge avec le total des compteurs en attente
        this.updatePendingCountsBadge();
    }

    // Afficher un badge avec le total des compteurs en attente
    updatePendingCountsBadge() {
        const totalPending = Object.values(this.pendingCounts).reduce((a, b) => a + b, 0);

        // Créer ou mettre à jour le badge
        let badge = document.getElementById('pending-counts-badge');
        if (!badge && totalPending > 0) {
            badge = document.createElement('div');
            badge.id = 'pending-counts-badge';
            badge.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #FF9800;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                cursor: help;
                display: none;
            `;
            document.body.appendChild(badge);
        }

        if (badge) {
            if (totalPending > 0) {
                badge.textContent = `📊 ${totalPending} en attente`;
                badge.title = `${totalPending} sélection(s) en attente d'être envoyées`;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Méthode pour forcer l'envoi des compteurs en attente (admin)
    forceSendPendingCounts() {
        if (Object.keys(this.pendingCounts).length === 0) {
            alert('Aucun compteur en attente');
            return;
        }

        const confirmSend = confirm(`Envoyer ${Object.values(this.pendingCounts).reduce((a, b) => a + b, 0)} compteur(s) en attente ?`);
        if (confirmSend) {
            this.sendPendingCountsViaWhatsApp('Admin - Envoi forcé');
        }
    }

    // Afficher un message de succès
    showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        if (!successDiv) {
            // Créer un élément de succès s'il n'existe pas
            const div = document.createElement('div');
            div.id = 'success-message';
            div.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 1000;
                display: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(div);
            successDiv = div;
        }

        successDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🎉</span>
                <div>
                    <strong style="font-size: 0.95rem;">Succès !</strong>
                    <div style="margin-top: 3px; font-size: 0.9rem;">${message}</div>
                </div>
            </div>
        `;
        successDiv.style.display = 'block';

        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }

    // Créer des cœurs flottants
    createFloatingHearts() {
        setInterval(() => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '❤️';
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.fontSize = (8 + Math.random() * 15) + 'px';
            heart.style.animationDuration = (2 + Math.random() * 3) + 's';
            document.body.appendChild(heart);

            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 7000);
        }, 400);
    }

    // Créer des cœurs de célébration
    createCelebrationHearts() {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'celebration-heart';
                heart.innerHTML = Math.random() > 0.5 ? '❤️' : '💖';
                heart.style.left = Math.random() * 100 + 'vw';
                heart.style.top = '80vh';
                document.body.appendChild(heart);

                setTimeout(() => {
                    if (heart.parentNode) {
                        heart.parentNode.removeChild(heart);
                    }
                }, 1500);
            }, i * 150);
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation du gestionnaire de réservation...');
    const manager = new ReservationManager();

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

    window.addEventListener('resize', function () {
        const nav = document.querySelector('nav ul');
        if (nav && window.innerWidth > 768) {
            nav.style.display = 'flex';
        }
    });

    // Ajouter un bouton admin en développement
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const adminBtn = document.createElement('button');
        adminBtn.textContent = '📊 Forcer envoi compteurs';
        adminBtn.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            background: #8B0000;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            z-index: 1000;
            cursor: pointer;
            font-size: 12px;
        `;
        adminBtn.addEventListener('click', () => manager.forceSendPendingCounts());
        document.body.appendChild(adminBtn);
    }
});