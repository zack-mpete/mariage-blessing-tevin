// Constantes pour les messages et les URLs
const MESSAGES = {
    FIELDS_REQUIRED: 'Veuillez remplir tous les champs correctement',
    MAX_SELECTIONS_REACHED: 'Maximum 2 boissons autorisées',
    MIN_SELECTIONS_REQUIRED: 'Veuillez sélectionner au moins une boisson',
    SUCCESS_RESERVATION: 'Vos préférences ont été enregistrées avec succès !',
    WHATSAPP_OPEN_MANUALLY: 'Si WhatsApp ne s\'ouvre pas automatiquement, cliquez sur le bouton ci-dessous',
    OFFLINE_MODE: 'Mode hors-ligne - Synchronisation automatique à la reconnexion'
};

const ROUTES = {
    INDEX: 'index.html',
    INVITATION: 'invitation.html'
};

// Constantes de configuration
const CONFIG = {
    MAX_SELECTIONS: 2,
    MIN_SELECTIONS: 1,
    WHATSAPP_TIMEOUT: 3000,
    REDIRECT_DELAY: 2000,
    HEARTS_INTERVAL: 400,
    GOOGLE_SHEETS_API_URL: 'https://script.google.com/macros/s/AKfycbw6ySJLe-b2REIzkk5RhbWIfgThXsIi3ytAod9OuPxwL25UaIr-msD3ByLY701gh3Ml/exec' // À remplacer par votre URL
};

// Gestionnaire de réservation avec Google Sheets
class ReservationManager {
    constructor() {
        // URL de votre Apps Script déployé
        this.API_URL = CONFIG.GOOGLE_SHEETS_API_URL;

        // Données des boissons avec compteurs initiaux
        this.boissonsData = {
            alcool: [
                { name: "Castel", icon: "🍺", count: 0, serverCount: 0 },
                { name: "Beaufort", icon: "🍺", count: 0, serverCount: 0 },
                { name: "Primus", icon: "🍺", count: 0, serverCount: 0 },
                { name: "Tembo", icon: "🍺", count: 0, serverCount: 0 },
                { name: "Mutzig", icon: "🍺", count: 0, serverCount: 0 },
                { name: "Nkoyi", icon: "🍶", count: 0, serverCount: 0 },
                { name: "Likofi", icon: "🍶", count: 0, serverCount: 0 },
                { name: "Legend", icon: "🥃", count: 0, serverCount: 0 },
                { name: "Champagne", icon: "🍾", count: 0, serverCount: 0 },
                { name: "Vin", icon: "🍷", count: 0, serverCount: 0 }
            ],
            nonAlcool: [
                { name: "Coca", icon: "🥤", count: 0, serverCount: 0 },
                { name: "Fanta", icon: "🥤", count: 0, serverCount: 0 },
                { name: "Vitalo", icon: "🧃", count: 0, serverCount: 0 },
                { name: "Maltina", icon: "🧃", count: 0, serverCount: 0 },
                { name: "Energy Malt", icon: "⚡", count: 0, serverCount: 0 },
                { name: "Eau minérale", icon: "💧", count: 0, serverCount: 0 },
                { name: "Jus d'orange", icon: "🧃", count: 0, serverCount: 0 },
                { name: "Jus de mangue", icon: "🧃", count: 0, serverCount: 0 }
            ]
        };

        this.whatsappNumber = "0829225086";
        this.isOnline = true;
        this.isSubmitting = false;
        this.selectedCount = 0;
        this.heartsInterval = null;

        // Compteurs en attente pour WhatsApp (si besoin)
        this.pendingWhatsAppCounts = {};
        this.pendingWhatsAppCountsKey = 'pendingWhatsAppCounts';

        // Compteurs en attente pour Google Sheets
        this.pendingReservationsKey = 'pendingReservations';

        this.init();
    }

    // Initialisation
    async init() {
        console.log('🚀 Initialisation du gestionnaire de réservation...');

        try {
            // 1. Charger les compteurs depuis Google Sheets
            await this.loadCountsFromServer();

            // 2. Charger les compteurs WhatsApp en attente
            await this.loadPendingWhatsAppCounts();

            // 3. Générer l'interface
            this.generateBoissonsGrid();
            this.setupEventListeners();
            this.createFloatingHearts();
            this.updateSelectionCounter();
            this.updateSelectionSummary();

            // 4. Vérifier la connexion périodiquement
            setInterval(() => this.checkConnection(), 30000);

            // 5. Mettre à jour le badge des réservations en attente
            this.updatePendingReservationsBadge();

            console.log('✅ Gestionnaire initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Mode hors-ligne activé. Vos réservations seront synchronisées plus tard.');
            this.isOnline = false;
        }
    }

    // ========== GOOGLE SHEETS INTEGRATION ==========

    // Charger les compteurs depuis le serveur
    async loadCountsFromServer() {
        console.log('📡 Chargement des compteurs depuis Google Sheets...');

        try {
            // CHANGEZ CETTE PARTIE : Utilisez POST au lieu de GET
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'getAllCounts'
                })
            });

            const data = await response.json();

            if (data.success && data.counts) {
                this.updateLocalCounts(data.counts);
                console.log('✅ Compteurs serveur chargés:', data.counts);
            } else {
                throw new Error(data.error || 'Format de réponse invalide');
            }
        } catch (error) {
            console.warn('⚠️ Impossible de contacter Google Sheets:', error);

            // Fallback au cache local
            const cachedCounts = localStorage.getItem('cachedCounts');
            if (cachedCounts) {
                this.updateLocalCounts(JSON.parse(cachedCounts));
                console.log('📂 Utilisation des compteurs en cache');
            }

            this.isOnline = false;
            this.showWarning('Mode hors-ligne - Les compteurs peuvent ne pas être à jour');
        }
    }
    // Mettre à jour les compteurs locaux avec les données du serveur
    updateLocalCounts(serverCounts) {
        this.boissonsData.alcool.forEach(boisson => {
            if (serverCounts[boisson.name]) {
                boisson.serverCount = serverCounts[boisson.name].count || 0;
                boisson.count = boisson.serverCount;
                boisson.lastUpdated = serverCounts[boisson.name].lastUpdated;
            }
        });

        this.boissonsData.nonAlcool.forEach(boisson => {
            if (serverCounts[boisson.name]) {
                boisson.serverCount = serverCounts[boisson.name].count || 0;
                boisson.count = boisson.serverCount;
                boisson.lastUpdated = serverCounts[boisson.name].lastUpdated;
            }
        });

        // Mettre en cache
        localStorage.setItem('cachedCounts', JSON.stringify(serverCounts));
    }

    // Vérifier la connexion
    async checkConnection() {
        try {
            const response = await fetch(this.API_URL + '?ping=' + Date.now());
            if (response.ok && !this.isOnline) {
                this.isOnline = true;
                console.log('✅ Connexion rétablie');
                this.showSuccess('Connecté au serveur');
                await this.syncPendingReservations();
            }
        } catch (error) {
            if (this.isOnline) {
                this.isOnline = false;
                console.warn('⚠️ Perte de connexion');
                this.showWarning('Mode hors-ligne');
            }
        }
    }

    // Synchroniser les réservations en attente
    async syncPendingReservations() {
        const pending = JSON.parse(localStorage.getItem(this.pendingReservationsKey) || '[]');

        if (pending.length > 0) {
            console.log(`🔄 Synchronisation de ${pending.length} réservation(s) en attente`);

            for (const reservation of pending) {
                try {
                    await this.sendToServer(reservation.name, reservation.selectedBoissons);
                } catch (error) {
                    console.error('❌ Erreur synchronisation:', error);
                    // Continuer avec les autres
                }
            }

            localStorage.removeItem(this.pendingReservationsKey);
            await this.loadCountsFromServer();
            this.updatePendingReservationsBadge();
            this.showSuccess(`${pending.length} réservation(s) synchronisées`);
        }
    }

    // async sendToServer(name, selectedBoissons) {
    try {
    const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'reserve',
            name: name,
            selectedBoissons: selectedBoissons,
            timestamp: new Date().toISOString()
        })
    });

    const data = await response.json();

    if (data.success) {
        this.updateLocalCounts(data.counts);
        this.updateCountersDisplay();
        return true;
    } else {
        throw new Error(data.error || 'Erreur serveur');
    }
} catch (error) {
    console.error('❌ Erreur envoi serveur:', error);
    throw error;
}
}Sauvegarder une réservation en attente(mode hors - ligne)
savePendingReservation(name, selectedBoissons) {
    const pending = JSON.parse(localStorage.getItem(this.pendingReservationsKey) || '[]');

    pending.push({
        name: name,
        selectedBoissons: selectedBoissons,
        timestamp: new Date().toISOString(),
        localTimestamp: Date.now()
    });

    localStorage.setItem(this.pendingReservationsKey, JSON.stringify(pending));

    // Mettre à jour le badge
    this.updatePendingReservationsBadge();

    // Mettre à jour les compteurs locaux
    selectedBoissons.forEach(boissonName => {
        const boisson = [...this.boissonsData.alcool, ...this.boissonsData.nonAlcool]
            .find(b => b.name === boissonName);
        if (boisson) {
            boisson.count++;
        }
    });

    this.updateCountersDisplay();
}

    // ========== WHATSAPP INTEGRATION ==========

    // Charger les compteurs WhatsApp en attente
    async loadPendingWhatsAppCounts() {
    try {
        const pendingData = localStorage.getItem(this.pendingWhatsAppCountsKey);
        if (pendingData) {
            this.pendingWhatsAppCounts = JSON.parse(pendingData);
            console.log('📦 Compteurs WhatsApp en attente chargés:', this.pendingWhatsAppCounts);
        } else {
            this.pendingWhatsAppCounts = {};
        }
    } catch (error) {
        console.error('❌ Erreur chargement compteurs WhatsApp:', error);
        this.pendingWhatsAppCounts = {};
    }
}

    // Sauvegarder les compteurs WhatsApp en attente
    async savePendingWhatsAppCounts() {
    try {
        localStorage.setItem(this.pendingWhatsAppCountsKey, JSON.stringify(this.pendingWhatsAppCounts));
    } catch (error) {
        console.error('❌ Erreur sauvegarde compteurs WhatsApp:', error);
    }
}

// Ajouter des compteurs WhatsApp en attente
addToPendingWhatsAppCounts(selectedBoissons) {
    selectedBoissons.forEach(boissonName => {
        this.pendingWhatsAppCounts[boissonName] = (this.pendingWhatsAppCounts[boissonName] || 0) + 1;
    });

    this.savePendingWhatsAppCounts();
    console.log('➕ Ajouté aux compteurs WhatsApp en attente:', selectedBoissons);

    // Mettre à jour le badge
    this.updatePendingWhatsAppBadge();
}

// ========== INTERFACE METHODS ==========

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
    let tooltip = '';
    if (boisson.lastUpdated) {
        const date = new Date(boisson.lastUpdated);
        tooltip = `Dernière réservation: ${date.toLocaleString('fr-FR')}`;
    }

    // Vérifier si cette boisson a des compteurs WhatsApp en attente
    const pendingWhatsAppCount = this.pendingWhatsAppCounts[boisson.name] || 0;

    let displayText = `(${boisson.count}`;
    if (pendingWhatsAppCount > 0) {
        displayText += ` +${pendingWhatsAppCount} WhatsApp`;
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
            <span class="boisson-count" title="${tooltip}">${displayText}</span>
            <input type="checkbox" name="${type}" value="${boisson.name}" style="display: none;">
        `;

    // Ajouter un indicateur visuel pour les compteurs en attente
    if (pendingWhatsAppCount > 0) {
        const countElement = item.querySelector('.boisson-count');
        countElement.style.color = '#FF9800';
        countElement.title += `\n${pendingWhatsAppCount} sélection(s) WhatsApp en attente`;
    }

    // Indiquer si c'est une valeur locale (hors-ligne)
    if (boisson.count !== boisson.serverCount) {
        const countElement = item.querySelector('.boisson-count');
        countElement.style.color = '#FF9800';
        countElement.title += `\n⚠️ Valeur locale (hors-ligne)`;
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
        this.animateSelection(item, 'deselect');
        this.updateSelectionSummary();
        return;
    }

    // Si on essaie de sélectionner mais que la limite est atteinte
    if (this.selectedCount >= CONFIG.MAX_SELECTIONS) {
        this.showAlert(MESSAGES.MAX_SELECTIONS_REACHED, 'warning');
        this.animateSelection(item, 'warning');
        return;
    }

    // Sélectionner normalement
    checkbox.checked = true;
    item.classList.add('selected');
    item.setAttribute('data-selected', 'true');
    this.selectedCount++;
    this.updateSelectionCounter();
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

    if (!summaryElement) return;

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
            const boisson = [...this.boissonsData.alcool, ...this.boissonsData.nonAlcool]
                .find(b => b.name === item);
            const count = boisson ? boisson.count : 0;
            const serverCount = boisson ? boisson.serverCount : 0;
            let displayText = `${item} <small>(${count}`;
            if (count !== serverCount) {
                displayText += ` <span style="color: #FF9800">[hors-ligne]</span>`;
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
    }
}

    // ========== FORM SUBMISSION ==========

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
    localStorage.setItem('inviteName', name);
    localStorage.setItem('selectedBoissons', JSON.stringify(selectedBoissons));

    try {
        // Gérer l'envoi à Google Sheets
        if (this.isOnline) {
            await this.sendToServer(name, selectedBoissons);
            this.showSuccessWithWhatsAppButton(name, selectedBoissons);
        } else {
            // Mode hors-ligne
            this.savePendingReservation(name, selectedBoissons);
            this.showOfflineSuccess(name, selectedBoissons);
        }

        // Gérer WhatsApp
        await this.handleWhatsAppNotification(name, selectedBoissons);

        // Célébration et redirection
        this.createCelebrationHearts();
        setTimeout(() => {
            window.location.href = ROUTES.INVITATION;
        }, CONFIG.REDIRECT_DELAY);

    } catch (error) {
        console.error('❌ Erreur:', error);
        this.showError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    }
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

    // ========== WHATSAPP NOTIFICATION ==========

    // Gestion des notifications WhatsApp
    async handleWhatsAppNotification(name, selectedBoissons) {
    try {
        console.log('📱 Début gestion WhatsApp...');

        // Ajouter aux compteurs WhatsApp en attente
        this.addToPendingWhatsAppCounts(selectedBoissons);

        // Préparer le message
        const message = this.formatWhatsAppMessage(name, selectedBoissons);

        // Essayer d'envoyer
        const sent = await this.sendWhatsAppMessage(message);

        if (sent) {
            console.log('✅ WhatsApp envoyé avec succès');
            // Retirer des compteurs en attente
            selectedBoissons.forEach(boisson => {
                if (this.pendingWhatsAppCounts[boisson] && this.pendingWhatsAppCounts[boisson] > 0) {
                    this.pendingWhatsAppCounts[boisson]--;
                    if (this.pendingWhatsAppCounts[boisson] <= 0) {
                        delete this.pendingWhatsAppCounts[boisson];
                    }
                }
            });
            this.savePendingWhatsAppCounts();
            this.updatePendingWhatsAppBadge();
        }

    } catch (error) {
        console.error('❌ Erreur gestion WhatsApp:', error);
    }
}

// Formater message WhatsApp
formatWhatsAppMessage(name, selectedBoissons) {
    const date = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Récupérer les compteurs actuels
    const countsText = selectedBoissons.map(b => {
        const boisson = [...this.boissonsData.alcool, ...this.boissonsData.nonAlcool]
            .find(item => item.name === b);
        const count = boisson ? boisson.count : 0;
        return `• ${b}: ${count} personne${count > 1 ? 's' : ''}`;
    }).join('\n');

    return `
🎉 NOUVELLE RÉSERVATION DE BOISSONS 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 INVITÉ
• Nom: ${name}

📅 DATE
${date}

🍹 BOISSONS CHOISIES
${countsText}

📊 STATUT
${this.isOnline ? '✅ En ligne - Synchronisé' : '⚠️ Hors-ligne - Synchronisation en attente'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💝 Merci pour votre participation !
Blessing & Tevin ❤️
        `.trim();
}

    // Envoyer un message WhatsApp
    async sendWhatsAppMessage(message) {
    if (!message) return false;

    const cleanNumber = this.whatsappNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    return new Promise((resolve) => {
        try {
            const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

            if (newWindow) {
                setTimeout(() => {
                    try {
                        if (newWindow && !newWindow.closed) {
                            newWindow.close();
                        }
                    } catch (e) { }
                }, 2000);
                resolve(true);
            } else {
                // Fallback avec iframe
                const iframe = document.createElement('iframe');
                iframe.style.cssText = 'position:absolute;width:1px;height:1px;border:0;opacity:0;';
                iframe.src = whatsappUrl;
                document.body.appendChild(iframe);

                setTimeout(() => {
                    if (iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                    resolve(true);
                }, 500);
            }
        } catch (error) {
            console.error('❌ Erreur envoi WhatsApp:', error);
            resolve(false);
        }
    });
}

// ========== UI UPDATES ==========

// Mettre à jour l'affichage des compteurs
updateCountersDisplay() {
    // Mettre à jour les compteurs alcool
    this.boissonsData.alcool.forEach(boisson => {
        const item = document.querySelector(`[data-boisson="${boisson.name}"]`);
        if (item) {
            const countElement = item.querySelector('.boisson-count');
            if (countElement) {
                const pendingWhatsAppCount = this.pendingWhatsAppCounts[boisson.name] || 0;
                let displayText = `(${boisson.count}`;
                if (pendingWhatsAppCount > 0) {
                    displayText += ` +${pendingWhatsAppCount} WhatsApp`;
                }
                displayText += `)`;
                countElement.textContent = displayText;

                // Mettre à jour le style
                let title = '';
                if (boisson.lastUpdated) {
                    const date = new Date(boisson.lastUpdated);
                    title = `Dernière réservation: ${date.toLocaleString('fr-FR')}`;
                }

                if (pendingWhatsAppCount > 0) {
                    countElement.style.color = '#FF9800';
                    title += `\n${pendingWhatsAppCount} sélection(s) WhatsApp en attente`;
                }

                if (boisson.count !== boisson.serverCount) {
                    countElement.style.color = '#FF9800';
                    title += `\n⚠️ Valeur locale (hors-ligne)`;
                }

                countElement.title = title;
            }
        }
    });

    // Mettre à jour les compteurs non-alcool
    this.boissonsData.nonAlcool.forEach(boisson => {
        const item = document.querySelector(`[data-boisson="${boisson.name}"]`);
        if (item) {
            const countElement = item.querySelector('.boisson-count');
            if (countElement) {
                const pendingWhatsAppCount = this.pendingWhatsAppCounts[boisson.name] || 0;
                let displayText = `(${boisson.count}`;
                if (pendingWhatsAppCount > 0) {
                    displayText += ` +${pendingWhatsAppCount} WhatsApp`;
                }
                displayText += `)`;
                countElement.textContent = displayText;

                let title = '';
                if (boisson.lastUpdated) {
                    const date = new Date(boisson.lastUpdated);
                    title = `Dernière réservation: ${date.toLocaleString('fr-FR')}`;
                }

                if (pendingWhatsAppCount > 0) {
                    countElement.style.color = '#FF9800';
                    title += `\n${pendingWhatsAppCount} sélection(s) WhatsApp en attente`;
                }

                if (boisson.count !== boisson.serverCount) {
                    countElement.style.color = '#FF9800';
                    title += `\n⚠️ Valeur locale (hors-ligne)`;
                }

                countElement.title = title;
            }
        }
    });

    // Mettre à jour les badges
    this.updatePendingReservationsBadge();
    this.updatePendingWhatsAppBadge();
}

// ========== BADGES ==========

// Mettre à jour le badge des réservations en attente
updatePendingReservationsBadge() {
    const pending = JSON.parse(localStorage.getItem(this.pendingReservationsKey) || '[]');
    const totalPending = pending.length;

    let badge = document.getElementById('pending-reservations-badge');
    if (!badge && totalPending > 0) {
        badge = document.createElement('div');
        badge.id = 'pending-reservations-badge';
        badge.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(135deg, #FF9800, #FF5722);
                color: white;
                padding: 10px 15px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                animation: pulse 2s infinite;
                border: 2px solid white;
                cursor: help;
            `;
        document.body.appendChild(badge);
    }

    if (badge) {
        if (totalPending > 0) {
            badge.innerHTML = `
                    <span>📊</span>
                    <span>${totalPending} réservations en attente</span>
                    <button onclick="window.reservationManager.syncPendingReservations()" 
                            style="background: rgba(255,255,255,0.2); border: none; 
                                   color: white; border-radius: 50%; width: 24px; 
                                   height: 24px; cursor: pointer; margin-left: 5px;"
                            title="Synchroniser maintenant">
                        🔄
                    </button>
                `;
            badge.title = `${totalPending} réservation(s) en attente de synchronisation avec Google Sheets`;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Mettre à jour le badge WhatsApp
updatePendingWhatsAppBadge() {
    const totalPending = Object.values(this.pendingWhatsAppCounts).reduce((a, b) => a + b, 0);

    let badge = document.getElementById('pending-whatsapp-badge');
    if (!badge && totalPending > 0) {
        badge = document.createElement('div');
        badge.id = 'pending-whatsapp-badge';
        badge.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 20px;
                background: linear-gradient(135deg, #25D366, #128C7E);
                color: white;
                padding: 10px 15px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                animation: pulse 2s infinite;
                border: 2px solid white;
                cursor: help;
            `;
        document.body.appendChild(badge);
    }

    if (badge) {
        if (totalPending > 0) {
            badge.innerHTML = `
                    <span>📱</span>
                    <span>${totalPending} WhatsApp en attente</span>
                    <button onclick="window.reservationManager.forceSendWhatsAppCounts()" 
                            style="background: rgba(255,255,255,0.2); border: none; 
                                   color: white; border-radius: 50%; width: 24px; 
                                   height: 24px; cursor: pointer; margin-left: 5px;"
                            title="Envoyer maintenant">
                        📤
                    </button>
                `;
            badge.title = `${totalPending} sélection(s) en attente d'envoi sur WhatsApp`;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Forcer l'envoi des compteurs WhatsApp
forceSendWhatsAppCounts() {
    if (Object.keys(this.pendingWhatsAppCounts).length === 0) {
        this.showAlert('Aucun message WhatsApp en attente', 'info');
        return;
    }

    const totalPending = Object.values(this.pendingWhatsAppCounts).reduce((a, b) => a + b, 0);
    const confirmSend = confirm(
        `Envoyer ${totalPending} message(s) WhatsApp en attente ?`
    );

    if (confirmSend) {
        const message = this.formatPendingWhatsAppMessage();
        if (message) {
            this.sendWhatsAppMessage(message).then(success => {
                if (success) {
                    this.pendingWhatsAppCounts = {};
                    this.savePendingWhatsAppCounts();
                    this.updatePendingWhatsAppBadge();
                    this.updateCountersDisplay();
                    this.showAlert('Messages WhatsApp envoyés avec succès !', 'success');
                } else {
                    this.showAlert('Échec de l\'envoi. Veuillez réessayer.', 'error');
                }
            });
        }
    }
}

// Formater message pour les compteurs WhatsApp en attente
formatPendingWhatsAppMessage() {
    if (Object.keys(this.pendingWhatsAppCounts).length === 0) {
        return null;
    }

    const date = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const totalPending = Object.values(this.pendingWhatsAppCounts).reduce((a, b) => a + b, 0);

    return `
📱 MESSAGES WHATSAPP EN ATTENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 DATE
${date}

📊 COMPTEURS EN ATTENTE
${Object.entries(this.pendingWhatsAppCounts)
            .map(([boisson, count]) => `• ${boisson}: ${count} personne${count > 1 ? 's' : ''}`)
            .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💝 Total: ${totalPending} message(s) en attente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();
}

// ========== SUCCESS MESSAGES ==========

// Afficher succès en ligne
showSuccessWithWhatsAppButton(name, selectedBoissons) {
    const message = this.formatWhatsAppMessage(name, selectedBoissons);
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

    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 5000);
}

// Afficher succès hors-ligne
showOfflineSuccess(name, selectedBoissons) {
    const pending = JSON.parse(localStorage.getItem(this.pendingReservationsKey) || '[]');

    const successDiv = document.createElement('div');
    successDiv.id = 'offline-success';
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
            border: 3px solid #FF9800;
        `;

    successDiv.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
                <h3 style="color: #FF9800; margin-bottom: 10px;">Enregistré hors-ligne</h3>
                <p style="color: #333; margin-bottom: 5px;">Merci <strong>${name}</strong> !</p>
                <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                    Vos ${selectedBoissons.length} préférence(s) ont été enregistrées localement.
                </p>
                <p style="color: #FF9800; font-size: 13px; background: #FFF3E0; 
                   padding: 10px; border-radius: 8px; margin: 15px 0;">
                    ${MESSAGES.OFFLINE_MODE}
                </p>
            </div>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
                    Réservations en attente : <strong>${pending.length}</strong>
                </p>
                <button onclick="window.reservationManager.syncPendingReservations()" 
                        style="background: #2196F3; color: white; border: none;
                               padding: 10px 20px; border-radius: 8px; cursor: pointer;
                               font-weight: bold; margin: 5px;">
                    🔄 Synchroniser maintenant
                </button>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 15px;">
                Redirection dans ${CONFIG.REDIRECT_DELAY / 1000} secondes...
            </p>
            
            <button onclick="document.getElementById('offline-success').remove()" 
                    style="position: absolute; top: 10px; right: 10px; 
                           background: none; border: none; font-size: 20px; 
                           cursor: pointer; color: #999;">
                ×
            </button>
        `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 5000);
}

// ========== UI HELPERS ==========

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

// Afficher un warning
showWarning(message) {
    this.showAlert(message, 'warning');
}

// Afficher un succès
showSuccess(message) {
    this.showAlert(message, 'success');
}

// ========== ANIMATIONS ==========

// Créer des cœurs flottants
createFloatingHearts() {
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

// Méthode pour synchroniser depuis l'extérieur
syncPendingReservations() {
    return this.syncPendingReservations();
}
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM chargé, initialisation du gestionnaire de réservation...');

    let reservationManager = null;

    try {
        reservationManager = new ReservationManager();

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
            if (reservationManager) {
                reservationManager.cleanup();
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
    window.reservationManager = reservationManager;
}