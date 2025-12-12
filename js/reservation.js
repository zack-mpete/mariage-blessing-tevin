// Constantes pour les messages et les URLs
const MESSAGES = {
    FIELDS_REQUIRED: 'Veuillez remplir tous les champs correctement',
    MAX_SELECTIONS_REACHED: 'Maximum 2 boissons autorisées',
    MIN_SELECTIONS_REQUIRED: 'Veuillez sélectionner au moins une boisson',
    SUCCESS_RESERVATION: 'Vos préférences ont été enregistrées avec succès !',
    WHATSAPP_OPEN_MANUALLY: 'Si WhatsApp ne s\'ouvre pas automatiquement, cliquez sur le bouton ci-dessous'
};

const ROUTES = {
    INDEX: 'index.html',
    INVITATION: 'invitation.html'
};

// Constantes de configuration
const CONFIG = {
    MAX_SELECTIONS: 2,
    MIN_SELECTIONS: 1,
    WHATSAPP_TIMEOUT: 3000, // 3 secondes pour le timeout WhatsApp
    REDIRECT_DELAY: 2000, // 2 secondes avant redirection
    HEARTS_INTERVAL: 400 // Intervalle pour les cœurs flottants
};

// Gestionnaire de réservation amélioré
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
        this.isSubmitting = false; // Flag pour éviter les soumissions multiples
        this.heartsInterval = null; // Référence à l'intervalle des cœurs

        this.init();
    }

    // Initialisation
    async init() {
        console.log('🚀 Initialisation du gestionnaire de réservation...');

        try {
            await this.loadAllCounts(); // Charger tous les compteurs
            this.generateBoissonsGrid();
            this.setupEventListeners();
            this.createFloatingHearts();
            this.updateSelectionCounter();
            this.updateSelectionSummary();

            console.log('✅ Gestionnaire initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur d\'initialisation. Veuillez recharger la page.');
        }
    }

    // Charger tous les compteurs (actuels + en attente)
    async loadAllCounts() {
        console.log('📊 Chargement de tous les compteurs...');

        try {
            // 1. Initialiser les compteurs actuels à 0
            this.initializeAllCounts();

            // 2. Charger les compteurs en attente depuis localStorage
            await this.loadPendingCounts();

            // 3. Mettre à jour les données des boissons
            this.updateBoissonsDataCounts();

            console.log('✅ Compteurs chargés avec succès');
        } catch (error) {
            console.error('❌ Erreur lors du chargement des compteurs:', error);
            throw error;
        }
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
                console.log('📦 Compteurs en attente chargés:', this.pendingCounts);

                // Fusionner avec les compteurs actuels
                Object.keys(this.pendingCounts).forEach(boissonName => {
                    this.preferencesCount[boissonName] =
                        (this.preferencesCount[boissonName] || 0) + this.pendingCounts[boissonName];
                });
            } else {
                this.pendingCounts = {};
                console.log('📭 Aucun compteur en attente trouvé');
            }
        } catch (error) {
            console.error('❌ Erreur chargement compteurs en attente:', error);
            this.pendingCounts = {};
            // Nettoyer les données corrompues
            localStorage.removeItem(this.pendingCountsKey);
        }
    }

    // Sauvegarder les compteurs en attente
    async savePendingCounts() {
        try {
            localStorage.setItem(this.pendingCountsKey, JSON.stringify(this.pendingCounts));
            console.log('💾 Compteurs en attente sauvegardés:', this.pendingCounts);
        } catch (error) {
            console.error('❌ Erreur sauvegarde compteurs en attente:', error);
            throw error;
        }
    }

    // Ajouter des compteurs en attente
    addToPendingCounts(selectedBoissons) {
        selectedBoissons.forEach(boissonName => {
            this.pendingCounts[boissonName] = (this.pendingCounts[boissonName] || 0) + 1;
        });

        this.savePendingCounts();
        console.log('➕ Ajouté aux compteurs en attente:', selectedBoissons);
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
        } else {
            console.warn('⚠️ Élément #alcool-grid non trouvé');
        }

        const nonAlcoolGrid = document.getElementById('non-alcool-grid');
        if (nonAlcoolGrid) {
            nonAlcoolGrid.innerHTML = '';
            this.boissonsData.nonAlcool.forEach(boisson => {
                nonAlcoolGrid.appendChild(this.createBoissonItem(boisson, 'non-alcool'));
            });
        } else {
            console.warn('⚠️ Élément #non-alcool-grid non trouvé');
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
        item.setAttribute('data-boisson', boisson.name);
        item.innerHTML = `
            <div class="boisson-checkbox"></div>
            <span class="boisson-name">${boisson.icon} ${boisson.name}</span>
            <span class="boisson-count">${displayText}</span>
            <input type="checkbox" name="${type}" value="${boisson.name}" style="display: none;">
        `;

        // Ajouter un indicateur visuel pour les compteurs en attente
        if (pendingCount > 0) {
            const countElement = item.querySelector('.boisson-count');
            countElement.style.color = '#FF9800';
            countElement.title = `${pendingCount} sélection(s) en attente d'envoi`;
        }

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBoissonSelection(item);
        });

        return item;
    }

    // Basculer la sélection d'une boisson avec limite
    toggleBoissonSelection(item) {
        if (this.isSubmitting) {
            console.log('⏸️ Soumission en cours, sélection désactivée');
            return;
        }

        const checkbox = item.querySelector('input[type="checkbox"]');
        const isCurrentlySelected = checkbox.checked;

        // Si on essaie de désélectionner
        if (isCurrentlySelected) {
            checkbox.checked = false;
            item.classList.remove('selected');
            item.setAttribute('data-selected', 'false');
            this.selectedCount = Math.max(0, this.selectedCount - 1);
            this.updateSelectionCounter();

            // Animation de désélection
            this.animateSelection(item, 'deselect');

            this.updateSelectionSummary();
            return;
        }

        // Si on essaie de sélectionner mais que la limite est atteinte
        if (this.selectedCount >= CONFIG.MAX_SELECTIONS) {
            this.showAlert(MESSAGES.MAX_SELECTIONS_REACHED, 'warning');

            // Animation d'alerte
            this.animateSelection(item, 'warning');
            return;
        }

        // Sélectionner normalement
        checkbox.checked = true;
        item.classList.add('selected');
        item.setAttribute('data-selected', 'true');
        this.selectedCount++;
        this.updateSelectionCounter();

        // Animation de sélection
        this.animateSelection(item, 'select');

        this.updateSelectionSummary();
    }

    // Animation de sélection
    animateSelection(element, type) {
        element.classList.add(`${type}-animation`);
        setTimeout(() => {
            element.classList.remove(`${type}-animation`);
        }, 300);
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

        if (!summaryElement) {
            console.warn('⚠️ Élément #selection-summary non trouvé');
            return;
        }

        if (selectedItems.length > 0) {
            summaryElement.innerHTML = `
                <div class="summary-title">
                    <strong>Vos sélections ${this.selectedCount}/${CONFIG.MAX_SELECTIONS}</strong>
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
                    <strong>Vos sélections 0/${CONFIG.MAX_SELECTIONS}</strong>
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
            // Empêcher la soumission multiple
            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                if (this.isSubmitting) {
                    console.log('⏸️ Soumission déjà en cours');
                    return;
                }

                this.isSubmitting = true;

                try {
                    await this.handleFormSubmit();
                } catch (error) {
                    console.error('❌ Erreur lors de la soumission:', error);
                    this.showError('Une erreur est survenue. Veuillez réessayer.');
                } finally {
                    setTimeout(() => {
                        this.isSubmitting = false;
                    }, 1000);
                }
            });

            console.log('✅ Écouteurs d\'événements configurés');
        } else {
            console.error('❌ Formulaire de réservation non trouvé');
        }
    }

    // Gérer la soumission du formulaire
    async handleFormSubmit() {
        const nameInput = document.getElementById('name');
        const name = nameInput ? nameInput.value.trim() : '';
        const selectedBoissons = this.getSelectedBoissons();

        console.log('📝 Soumission:', { nom: name, boissons: selectedBoissons });

        // Validation
        const validation = this.validateForm(name, selectedBoissons);
        if (!validation.valid) {
            this.showAlert(validation.message, 'error');
            if (validation.field === 'name' && nameInput) nameInput.focus();
            return;
        }

        // Sauvegarder les informations
        const reservationData = {
            nom: name,
            boissons: selectedBoissons,
            date: new Date().toISOString(),
            timestamp: Date.now()
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

        // Gestion WhatsApp
        await this.handleWhatsAppNotification(name, selectedBoissons, oldCounts);

        // Afficher message de confirmation
        this.showSuccessWithWhatsAppButton(name, selectedBoissons);
        this.createCelebrationHearts();

        // Redirection vers invitation.html après délai
        setTimeout(() => {
            console.log('🔗 Redirection vers invitation.html');
            window.location.href = ROUTES.INVITATION;
        }, CONFIG.REDIRECT_DELAY);
    }

    // Valider le formulaire
    validateForm(name, selectedBoissons) {
        if (!name || name.length < 2) {
            return { valid: false, message: 'Veuillez entrer votre nom complet (minimum 2 caractères)', field: 'name' };
        }

        if (selectedBoissons.length === 0) {
            return { valid: false, message: MESSAGES.MIN_SELECTIONS_REQUIRED, field: 'boissons' };
        }

        if (selectedBoissons.length > CONFIG.MAX_SELECTIONS) {
            return { valid: false, message: MESSAGES.MAX_SELECTIONS_REACHED, field: 'boissons' };
        }

        return { valid: true, message: '' };
    }

    // Gestion intelligente des notifications WhatsApp
    async handleWhatsAppNotification(name, selectedBoissons, oldCounts) {
        try {
            console.log('📱 Début gestion WhatsApp...');

            // TOUJOURS ajouter aux compteurs en attente d'abord
            this.addToPendingCounts(selectedBoissons);

            // Préparer les messages
            const pendingMessage = this.formatPendingCountsMessage(name);
            const singleMessage = this.formatSingleReservationMessage(name, selectedBoissons, oldCounts);

            // 1. Essayer d'envoyer les compteurs en attente
            let pendingSent = false;
            if (Object.keys(this.pendingCounts).length > 0) {
                pendingSent = await this.sendWhatsAppMessage(pendingMessage);
                if (pendingSent) {
                    console.log('✅ Compteurs en attente envoyés avec succès');
                    this.clearPendingCounts();
                }
            }

            // 2. Essayer d'envoyer la réservation individuelle
            const singleSent = await this.sendWhatsAppMessage(singleMessage);

            if (singleSent) {
                console.log('✅ Réservation individuelle envoyée avec succès');

                // Si la réservation a été envoyée, ajuster les compteurs en attente
                selectedBoissons.forEach(boisson => {
                    if (this.pendingCounts[boisson] && this.pendingCounts[boisson] > 0) {
                        this.pendingCounts[boisson]--;
                        if (this.pendingCounts[boisson] <= 0) {
                            delete this.pendingCounts[boisson];
                        }
                    }
                });
                this.savePendingCounts();
            }

            console.log('📊 Résultat WhatsApp:', { pendingSent, singleSent });

        } catch (error) {
            console.error('❌ Erreur gestion WhatsApp:', error);
            // En cas d'erreur, les compteurs restent en attente
        }
    }

    // Formater message pour les compteurs en attente
    formatPendingCountsMessage(name) {
        if (Object.keys(this.pendingCounts).length === 0) {
            return null;
        }

        const date = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const totalPending = Object.values(this.pendingCounts).reduce((a, b) => a + b, 0);

        return `
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
💝 Total des compteurs en attente: ${totalPending}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();
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

    // Envoyer un message WhatsApp (méthode améliorée)
    async sendWhatsAppMessage(message) {
        if (!message) return false;

        const cleanNumber = this.whatsappNumber.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

        console.log('📤 Tentative envoi WhatsApp:', whatsappUrl.substring(0, 100) + '...');

        return new Promise((resolve) => {
            try {
                // Méthode 1: Ouvrir dans un nouvel onglet (plus fiable)
                const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

                if (newWindow) {
                    console.log('✅ WhatsApp ouvert dans nouvel onglet');

                    // Fermer la fenêtre après 2 secondes
                    setTimeout(() => {
                        try {
                            if (newWindow && !newWindow.closed) {
                                newWindow.close();
                            }
                        } catch (e) {
                            // Ignorer les erreurs de fermeture
                        }
                    }, 2000);

                    resolve(true);
                } else {
                    // Méthode 2: Fallback avec iframe
                    console.log('⚠️ Nouvel onglet bloqué, tentative avec iframe...');

                    const iframe = document.createElement('iframe');
                    iframe.style.cssText = 'position:absolute;width:1px;height:1px;border:0;opacity:0;';
                    iframe.src = whatsappUrl;
                    document.body.appendChild(iframe);

                    setTimeout(() => {
                        if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                        }
                        console.log('✅ Message WhatsApp préparé via iframe');
                        resolve(true);
                    }, 500);
                }
            } catch (error) {
                console.error('❌ Erreur envoi WhatsApp:', error);
                resolve(false);
            }
        });
    }

    // Vider les compteurs en attente
    clearPendingCounts() {
        this.pendingCounts = {};
        localStorage.removeItem(this.pendingCountsKey);
        console.log('🗑️ Compteurs en attente vidés');

        // Mettre à jour l'affichage
        this.updateCountersDisplay();
        this.updatePendingCountsBadge();
    }

    // Mettre à jour l'affichage des compteurs
    updateCountersDisplay() {
        // Mettre à jour les compteurs alcool
        document.querySelectorAll('#alcool-grid .boisson-item').forEach(item => {
            const boissonName = item.getAttribute('data-boisson');
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

                // Mettre à jour le style
                if (pendingCount > 0) {
                    countElement.style.color = '#FF9800';
                    countElement.title = `${pendingCount} sélection(s) en attente d'envoi`;
                } else {
                    countElement.style.color = '';
                    countElement.title = '';
                }
            }
        });

        // Mettre à jour les compteurs non-alcool
        document.querySelectorAll('#non-alcool-grid .boisson-item').forEach(item => {
            const boissonName = item.getAttribute('data-boisson');
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

        // Mettre à jour le badge
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
                background: linear-gradient(135deg, #FF9800, #FF5722);
                color: white;
                padding: 10px 15px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
                cursor: help;
                display: flex;
                align-items: center;
                gap: 8px;
                animation: pulse 2s infinite;
                border: 2px solid white;
            `;
            document.body.appendChild(badge);
        }

        if (badge) {
            if (totalPending > 0) {
                badge.innerHTML = `<span>📊</span> <span>${totalPending} en attente</span>`;
                badge.title = `${totalPending} sélection(s) en attente d'être envoyées sur WhatsApp`;
                badge.style.display = 'flex';

                // Ajouter un bouton pour forcer l'envoi
                if (!badge.querySelector('.force-send-btn')) {
                    const forceBtn = document.createElement('button');
                    forceBtn.className = 'force-send-btn';
                    forceBtn.textContent = '📤';
                    forceBtn.style.cssText = `
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        cursor: pointer;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-left: 5px;
                    `;
                    forceBtn.title = 'Forcer l\'envoi des compteurs en attente';
                    forceBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.forceSendPendingCounts();
                    });
                    badge.appendChild(forceBtn);
                }
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Méthode pour forcer l'envoi des compteurs en attente
    forceSendPendingCounts() {
        if (Object.keys(this.pendingCounts).length === 0) {
            this.showAlert('Aucun compteur en attente', 'info');
            return;
        }

        const confirmSend = confirm(
            `Envoyer ${Object.values(this.pendingCounts).reduce((a, b) => a + b, 0)} ` +
            `compteur(s) en attente sur WhatsApp ?`
        );

        if (confirmSend) {
            const message = this.formatPendingCountsMessage('Admin - Envoi forcé');
            if (message) {
                this.sendWhatsAppMessage(message).then(success => {
                    if (success) {
                        this.clearPendingCounts();
                        this.showAlert('Compteurs envoyés avec succès !', 'success');
                    } else {
                        this.showAlert('Échec de l\'envoi. Veuillez réessayer.', 'error');
                    }
                });
            }
        }
    }

    // Afficher un message de succès avec bouton WhatsApp
    showSuccessWithWhatsAppButton(name, selectedBoissons) {
        // Créer un message de réservation pour WhatsApp
        const message = this.formatSingleReservationMessage(name, selectedBoissons, {});
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;

        const successDiv = document.createElement('div');
        successDiv.id = 'success-message-enhanced';
        successDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 25px;
            border-radius: 15px;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 90%;
            animation: fadeIn 0.3s ease-out;
            border: 3px solid #4CAF50;
        `;

        successDiv.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                <h3 style="color: #4CAF50; margin-bottom: 10px;">Succès !</h3>
                <p style="color: #333; margin-bottom: 5px;">Merci <strong>${name}</strong> !</p>
                <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                    Vos ${selectedBoissons.length} préférence(s) ont été enregistrées.
                </p>
            </div>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                    ${MESSAGES.WHATSAPP_OPEN_MANUALLY}
                </p>
                <a href="${whatsappUrl}" target="_blank" 
                   style="display: inline-block; background: #25D366; color: white; 
                          padding: 12px 25px; border-radius: 8px; text-decoration: none;
                          font-weight: bold; font-size: 16px; transition: all 0.3s;">
                    📱 Ouvrir WhatsApp
                </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 15px;">
                Redirection dans ${CONFIG.REDIRECT_DELAY / 1000} secondes...
            </p>
            
            <button onclick="document.getElementById('success-message-enhanced').remove()" 
                    style="position: absolute; top: 10px; right: 10px; 
                           background: none; border: none; font-size: 20px; 
                           cursor: pointer; color: #999;">
                ×
            </button>
        `;

        document.body.appendChild(successDiv);

        // Fermer automatiquement après 5 secondes
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 5000);
    }

    // Afficher une alerte
    showAlert(message, type = 'info') {
        const types = {
            success: { color: '#4CAF50', icon: '✅' },
            error: { color: '#f44336', icon: '❌' },
            warning: { color: '#FF9800', icon: '⚠️' },
            info: { color: '#2196F3', icon: 'ℹ️' }
        };

        const config = types[type] || types.info;

        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${config.color};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            max-width: 350px;
        `;

        alertDiv.innerHTML = `
            <span style="font-size: 20px;">${config.icon}</span>
            <div>
                <div style="font-weight: bold; font-size: 0.95rem; margin-bottom: 3px;">
                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <div style="font-size: 0.9rem;">${message}</div>
            </div>
            <button onclick="this.parentElement.remove()" 
                    style="margin-left: auto; background: none; border: none; 
                           color: white; font-size: 18px; cursor: pointer; padding: 0 5px;">
                ×
            </button>
        `;

        document.body.appendChild(alertDiv);

        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }

    // Afficher une erreur
    showError(message) {
        this.showAlert(message, 'error');
    }

    // Créer des cœurs flottants
    createFloatingHearts() {
        // Nettoyer l'intervalle précédent s'il existe
        if (this.heartsInterval) {
            clearInterval(this.heartsInterval);
        }

        this.heartsInterval = setInterval(() => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '❤️';
            heart.style.cssText = `
                position: fixed;
                top: 100vh;
                left: ${Math.random() * 100}vw;
                font-size: ${8 + Math.random() * 15}px;
                z-index: 1;
                pointer-events: none;
                animation: floatUp ${2 + Math.random() * 3}s linear forwards;
            `;
            document.body.appendChild(heart);

            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 7000);
        }, CONFIG.HEARTS_INTERVAL);
    }

    // Créer des cœurs de célébration
    createCelebrationHearts() {
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'celebration-heart';
                heart.innerHTML = ['❤️', '💖', '💗', '💓', '💞'][Math.floor(Math.random() * 5)];
                heart.style.cssText = `
                    position: fixed;
                    top: 80vh;
                    left: ${Math.random() * 100}vw;
                    font-size: ${20 + Math.random() * 30}px;
                    z-index: 9999;
                    pointer-events: none;
                    animation: celebrate ${1 + Math.random()}s ease-out forwards;
                `;
                document.body.appendChild(heart);

                setTimeout(() => {
                    if (heart.parentNode) {
                        heart.parentNode.removeChild(heart);
                    }
                }, 1500);
            }, i * 100);
        }
    }

    // Nettoyer les ressources
    cleanup() {
        if (this.heartsInterval) {
            clearInterval(this.heartsInterval);
            this.heartsInterval = null;
        }
    }
}

// Initialisation améliorée
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM chargé, initialisation du gestionnaire de réservation...');

    let manager = null;

    try {
        manager = new ReservationManager();

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

        // Nettoyer à la déconnexion
        window.addEventListener('beforeunload', () => {
            if (manager) {
                manager.cleanup();
            }
        });

        // Ajouter des styles d'animation
        if (!document.getElementById('animation-styles')) {
            const style = document.createElement('style');
            style.id = 'animation-styles';
            style.textContent = `
                @keyframes floatUp {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
                }
                
                @keyframes celebrate {
                    0% { transform: translateY(0) scale(0.5); opacity: 1; }
                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -60%); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                .select-animation {
                    animation: selectPulse 0.3s ease-out;
                }
                
                .deselect-animation {
                    animation: deselectFade 0.3s ease-out;
                }
                
                .warning-animation {
                    animation: warningShake 0.5s ease-out;
                }
                
                @keyframes selectPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                @keyframes deselectFade {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
                
                @keyframes warningShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }

        console.log('✅ Application initialisée avec succès');

    } catch (error) {
        console.error('❌ Erreur critique lors de l\'initialisation:', error);
        alert('Une erreur critique est survenue. Veuillez recharger la page.');
    }
});

// Exporter pour le débogage
if (typeof window !== 'undefined') {
    window.ReservationManager = ReservationManager;
}