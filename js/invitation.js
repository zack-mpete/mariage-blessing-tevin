// Fonction pour récupérer les données de réservation (version améliorée)
function getReservationData() {
    try {
        console.log('🔍 Récupération des données de réservation...');

        // 1. Essayer d'abord sessionStorage (données de la session courante)
        let reservationData = sessionStorage.getItem('reservationData');

        // 2. Si vide, essayer localStorage
        if (!reservationData) {
            console.log('📦 Données non trouvées dans sessionStorage, vérification localStorage...');
            reservationData = localStorage.getItem('reservationData');
        }

        // 3. Si on a des données JSON, les parser
        if (reservationData) {
            try {
                const data = JSON.parse(reservationData);
                console.log('✅ Données récupérées:', data);
                return data;
            } catch (parseError) {
                console.error('❌ Erreur de parsing JSON:', parseError);
            }
        }

        // 4. Fallback: vérifier les anciennes clés pour compatibilité
        console.log('🔄 Tentative de récupération avec les anciennes clés...');
        const inviteName = localStorage.getItem('inviteName');
        const reservationType = localStorage.getItem('reservationType') || 'seul';

        if (inviteName) {
            const fallbackData = {
                nom: inviteName,
                type: reservationType,
                date: new Date().toISOString(),
                timestamp: Date.now(),
                source: 'legacy'
            };
            console.log('✅ Données de fallback récupérées:', fallbackData);

            // Sauvegarder au format JSON pour les prochaines fois
            sessionStorage.setItem('reservationData', JSON.stringify(fallbackData));

            return fallbackData;
        }

        console.warn('⚠️ Aucune donnée de réservation trouvée');
        return null;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
        return null;
    }
}

// Fonction pour personnaliser l'interface selon le type de réservation
function customizeInterfaceForReservationType(type, name) {
    console.log('🎭 Personnalisation pour le type:', type);

    // Personnaliser le message de salutation
    const greetingElement = document.getElementById('personalized-greeting');
    if (greetingElement) {
        if (type === 'couple') {
            greetingElement.innerHTML = `Chers <span class="nom" id="guest-name">${name}</span>, nous avons
              l'immense joie de vous convier à la célébration de notre mariage
              le <strong>samedi</strong>`;
        } else {
            greetingElement.innerHTML = `Cher(e) <span class="nom" id="guest-name">${name}</span>, nous avons
              l'immense joie de vous convier à la célébration de notre mariage
              le <strong>samedi</strong>`;
        }
    }

    // Personnaliser les messages spécifiques
    const coupleMessage = document.getElementById('couple-message');
    const singleMessage = document.getElementById('single-message');

    if (type === 'couple') {
        if (coupleMessage) coupleMessage.style.display = 'block';
        if (singleMessage) singleMessage.style.display = 'none';
    } else {
        if (coupleMessage) coupleMessage.style.display = 'none';
        if (singleMessage) singleMessage.style.display = 'block';
    }

    // Personnaliser les informations de réservation
    const reservationTypeInfo = document.getElementById('reservation-type-info');
    if (reservationTypeInfo) {
        if (type === 'couple') {
            reservationTypeInfo.innerHTML = `
                <div class="reservation-type-details">
                    <p>👥 <strong>Réservation pour un couple</strong></p>
                    <p>Deux places vous sont réservées</p>
                </div>
            `;
        } else {
            reservationTypeInfo.innerHTML = `
                <div class="reservation-type-details">
                    <p>👤 <strong>Réservation pour une personne</strong></p>
                    <p>Une place vous est réservée</p>
                </div>
            `;
        }
    }

    // Personnaliser les badges de type
    const guestTypeBadge = document.getElementById('guest-type-badge');
    if (guestTypeBadge) {
        if (type === 'couple') {
            guestTypeBadge.innerHTML = '<span class="badge couple">👥 Invité en couple</span>';
            guestTypeBadge.className = 'guest-type-badge couple';
        } else {
            guestTypeBadge.innerHTML = '<span class="badge single">👤 Invité seul(e)</span>';
            guestTypeBadge.className = 'guest-type-badge single';
        }
    }

    // Personnaliser les boutons
    const downloadHint = document.getElementById('download-hint');
    const printHint = document.getElementById('print-hint');
    const shareHint = document.getElementById('share-hint');

    if (type === 'couple') {
        if (downloadHint) downloadHint.textContent = ' (pour vous deux)';
        if (printHint) printHint.textContent = ' (pour vous deux)';
        if (shareHint) shareHint.textContent = ' (partagez en couple)';
    } else {
        if (downloadHint) downloadHint.textContent = ' (votre copie)';
        if (printHint) printHint.textContent = ' (votre copie)';
        if (shareHint) shareHint.textContent = ' (partagez avec vos proches)';
    }

    // Personnaliser les instructions
    const instructionsText = document.getElementById('instructions-text');
    if (instructionsText) {
        if (type === 'couple') {
            instructionsText.innerHTML = '💝 <strong>Astuce :</strong> Téléchargez ou imprimez votre invitation pour la conserver en souvenir, une seule invitation pour vous deux suffit !';
        } else {
            instructionsText.innerHTML = '💝 <strong>Astuce :</strong> Téléchargez ou imprimez votre invitation pour la conserver en souvenir !';
        }
    }

    // Personnaliser le footer
    const footerReservationType = document.getElementById('footer-reservation-type');
    if (footerReservationType) {
        if (type === 'couple') {
            footerReservationType.textContent = 'Invitation valable pour deux personnes';
        } else {
            footerReservationType.textContent = 'Invitation valable pour une personne';
        }
    }
}

// Fonction pour afficher le nom (MAJ)
function displayReservationInfo() {
    try {
        const data = getReservationData();

        if (!data || !data.nom) {
            console.log('🎭 Utilisation des valeurs par défaut');
            const defaultName = "Cher(e) invité(e)";
            this.updateNameInUI(defaultName);
            this.customizeInterfaceForReservationType('seul', defaultName);
            return;
        }

        // Afficher le nom
        if (data.nom) {
            console.log('✨ Affichage du nom:', data.nom);
            this.updateNameInUI(data.nom);
        }

        // Personnaliser selon le type de réservation
        if (data.type) {
            console.log('📝 Type de réservation détecté:', data.type);
            this.customizeInterfaceForReservationType(data.type, data.nom);
        } else {
            // Par défaut, on considère "seul"
            this.customizeInterfaceForReservationType('seul', data.nom || "Cher(e) invité(e)");
        }

    } catch (error) {
        console.error('💥 Erreur lors de l\'affichage des informations:', error);
        this.updateNameInUI("Cher(e) invité(e)");
        this.customizeInterfaceForReservationType('seul', "Cher(e) invité(e)");
    }
}

// Fonction pour mettre à jour le nom dans l'interface
function updateNameInUI(name) {
    console.log('🎨 Mise à jour du nom dans l\'UI:', name);

    // Mettre à jour le nom principal avec fallback sécurisé
    const nameElement = document.getElementById('guest-name');
    if (nameElement) {
        nameElement.textContent = name || "Cher(e) invité(e)";
        console.log('✅ Nom principal affiché');
    }

    // Mettre à jour le titre de bienvenue
    const welcomeTitle = document.getElementById('welcome-title');
    if (welcomeTitle) {
        const data = getReservationData();
        const type = data?.type || 'seul';

        if (type === 'couple') {
            welcomeTitle.textContent = `🎉 Bienvenue à vous deux ! 🎉`;
        } else {
            welcomeTitle.textContent = `🎉 Bienvenue ${name || "Cher(e) invité(e)"} ! 🎉`;
        }
    }

    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        const data = getReservationData();
        const type = data?.type || 'seul';

        if (type === 'couple') {
            welcomeMessage.textContent = 'Nous sommes ravis de vous accueillir en tant que couple sur votre invitation personnelle.';
        } else {
            welcomeMessage.textContent = 'Nous sommes ravis de vous accueillir sur votre invitation personnelle.';
        }
    }

    // Mettre à jour tous les éléments avec la classe .nom
    const nomElements = document.querySelectorAll('.nom');
    nomElements.forEach(el => {
        if (el.id !== 'guest-name') {
            el.textContent = name || "Cher(e) invité(e)";
        }
    });
}

// Fonction pour debug (utile pour le développement)
function debugStorage() {
    console.log('=== 🔍 DEBUG STORAGE ===');
    console.log('sessionStorage reservationData:', sessionStorage.getItem('reservationData'));
    console.log('localStorage reservationData:', localStorage.getItem('reservationData'));
    console.log('localStorage inviteName:', localStorage.getItem('inviteName'));
    console.log('localStorage reservationType:', localStorage.getItem('reservationType'));
    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('sessionStorage keys:', Object.keys(sessionStorage));
    console.log('=========================');
}

// Fonction pour capturer l'invitation complète
function captureInvitation() {
    return new Promise((resolve, reject) => {
        try {
            const invitationSection = document.querySelector('.invit-page .conteneur');

            if (!invitationSection) {
                reject(new Error('Section invitation non trouvée'));
                return;
            }

            console.log('📸 Capture de l\'invitation...');

            const clone = invitationSection.cloneNode(true);
            clone.style.cssText = `
                position: fixed;
                left: -9999px;
                top: 0;
                width: 794px;
                padding: 40px;
                background: white;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            `;

            document.body.appendChild(clone);

            html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: true,
                onclone: (document, element) => {
                    element.style.width = '794px';
                    element.style.boxSizing = 'border-box';

                    const allElements = element.querySelectorAll('*');
                    allElements.forEach(el => {
                        el.style.visibility = 'visible';
                        el.style.opacity = '1';
                    });
                }
            }).then(canvas => {
                document.body.removeChild(clone);
                resolve(canvas);
            }).catch(error => {
                document.body.removeChild(clone);
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
}

// Fonction pour télécharger en PDF
function downloadInvitationPDF() {
    try {
        const downloadBtn = document.getElementById('download-btn');
        const originalText = downloadBtn?.querySelector('.btn-text')?.textContent;

        if (downloadBtn) {
            downloadBtn.querySelector('.btn-text').textContent = 'Génération en cours...';
            downloadBtn.disabled = true;
        }

        captureInvitation().then(canvas => {
            const data = getReservationData();
            const guestName = data?.nom || 'Invité';
            const reservationType = data?.type || 'seul';

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight) * 0.95;
            const centerX = (pageWidth - imgWidth * ratio) / 2;
            const centerY = (pageHeight - imgHeight * ratio) / 2;

            pdf.addImage(
                imgData,
                'JPEG',
                centerX,
                centerY,
                imgWidth * ratio,
                imgHeight * ratio
            );

            // Ajouter une note selon le type
            if (reservationType === 'couple') {
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.text('Invitation valable pour deux personnes', 105, 280, { align: 'center' });
            }

            pdf.setProperties({
                title: `Invitation Mariage - ${guestName}`,
                subject: `Invitation au mariage de Blessing & Tevin - ${reservationType === 'couple' ? 'Couple' : 'Personne seule'}`,
                author: 'Blessing & Tevin',
                keywords: `mariage, invitation, ${reservationType}`,
                creator: 'Site Mariage B&T'
            });

            const fileName = generateFileName(guestName, reservationType);
            pdf.save(fileName);

            if (downloadBtn) {
                setTimeout(() => {
                    downloadBtn.querySelector('.btn-text').textContent = '✅ Téléchargé !';
                    setTimeout(() => {
                        if (downloadBtn) {
                            downloadBtn.querySelector('.btn-text').textContent = originalText;
                            downloadBtn.disabled = false;
                        }
                    }, 1500);
                }, 500);
            }

        }).catch(error => {
            console.error('❌ Erreur lors de la capture:', error);
            alert('Erreur lors de la génération du PDF');

            if (downloadBtn) {
                downloadBtn.querySelector('.btn-text').textContent = originalText;
                downloadBtn.disabled = false;
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors du téléchargement:', error);
        alert('Erreur lors du téléchargement');
    }
}

// Fonction pour imprimer l'invitation
function printInvitation() {
    try {
        const printBtn = document.getElementById('print-btn');
        const originalText = printBtn?.querySelector('.btn-text')?.textContent;

        if (printBtn) {
            printBtn.querySelector('.btn-text').textContent = 'Préparation...';
            printBtn.disabled = true;
        }

        captureInvitation().then(canvas => {
            const data = getReservationData();
            const guestName = data?.nom || 'Invité';
            const reservationType = data?.type || 'seul';

            const printWindow = window.open('', '_blank', 'width=800,height=600');

            if (!printWindow) {
                alert('Veuillez autoriser les pop-ups pour l\'impression');
                if (printBtn) {
                    printBtn.querySelector('.btn-text').textContent = originalText;
                    printBtn.disabled = false;
                }
                return;
            }

            const imgData = canvas.toDataURL('image/png');

            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Invitation Mariage - ${guestName}</title>
                    <style>
                        @media print {
                            @page {
                                margin: 0;
                                size: A4 portrait;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                background: white;
                            }
                            .print-container {
                                max-width: 100%;
                                max-height: 100%;
                            }
                            img {
                                width: 100%;
                                height: auto;
                                display: block;
                            }
                        }
                        @media screen {
                            body {
                                padding: 20px;
                                background: #f5f5f5;
                                text-align: center;
                            }
                            .print-container {
                                max-width: 80%;
                                margin: 0 auto;
                                background: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                            }
                            img {
                                max-width: 100%;
                                height: auto;
                                display: block;
                                margin: 0 auto;
                            }
                            .print-info {
                                margin-top: 20px;
                                color: #666;
                                font-size: 14px;
                                text-align: center;
                            }
                            .reservation-type {
                                margin-top: 10px;
                                padding: 8px 15px;
                                background: #f0f0f0;
                                border-radius: 20px;
                                display: inline-block;
                                font-size: 12px;
                            }
                            .couple-badge {
                                background: #e8f5e9;
                                color: #2e7d32;
                            }
                            .single-badge {
                                background: #e3f2fd;
                                color: #1565c0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <img src="${imgData}" alt="Invitation de mariage">
                        <div class="print-info">
                            <p>Invitation personnelle pour: ${guestName}</p>
                            <div class="reservation-type ${reservationType === 'couple' ? 'couple-badge' : 'single-badge'}">
                                ${reservationType === 'couple' ? '👥 Invitation pour un couple' : '👤 Invitation pour une personne'}
                            </div>
                            <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            }, 500);
                        };
                    <\/script>
                </body>
                </html>
            `);

            printWindow.document.close();

            printWindow.onbeforeunload = function () {
                if (printBtn) {
                    printBtn.querySelector('.btn-text').textContent = '✅ Imprimé !';
                    setTimeout(() => {
                        if (printBtn) {
                            printBtn.querySelector('.btn-text').textContent = originalText;
                            printBtn.disabled = false;
                        }
                    }, 1500);
                }
            };

        }).catch(error => {
            console.error('❌ Erreur lors de l\'impression:', error);
            alert('Erreur lors de la préparation de l\'impression');

            if (printBtn) {
                printBtn.querySelector('.btn-text').textContent = originalText;
                printBtn.disabled = false;
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'impression:', error);
        alert('Erreur lors de l\'impression');
    }
}

// Fonction pour générer un nom de fichier propre avec type
function generateFileName(guestName, type = 'seul') {
    const sanitizedName = guestName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    const date = new Date().toISOString().split('T')[0];
    const typeSuffix = type === 'couple' ? '-couple' : '-seul';

    if (sanitizedName && sanitizedName !== 'invite') {
        return `invitation-mariage-${sanitizedName}${typeSuffix}-${date}.pdf`;
    }

    return `invitation-mariage${typeSuffix}-${date}.pdf`;
}

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎉 Initialisation de la page d\'invitation...');

    // Afficher le debug storage
    debugStorage();

    // Afficher les informations de réservation
    displayReservationInfo();

    // Configurer les boutons d'action avec messages personnalisés
    const downloadBtn = document.getElementById('download-btn');
    const printBtn = document.getElementById('print-btn');
    const shareBtn = document.getElementById('share-btn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadInvitationPDF);
        console.log('✅ Bouton téléchargement configuré');
    }

    if (printBtn) {
        printBtn.addEventListener('click', printInvitation);
        console.log('✅ Bouton impression configuré');
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            const data = getReservationData();
            const guestName = data?.nom || "Invité";
            const reservationType = data?.type || 'seul';

            let message = "";
            if (reservationType === 'couple') {
                message = `🎉 Nous venons de recevoir notre invitation personnelle pour le mariage de Blessing & Tevin !\n\n` +
                    `Nous sommes ${guestName} et nous sommes invités en couple à leur célébration le 27 décembre 2025.\n\n` +
                    `💝 Rendez-vous sur le site pour réserver votre place !\n` +
                    `https://mariage-blessing-tevin.vercel.app`;
            } else {
                message = `🎉 Je viens de recevoir mon invitation personnelle pour le mariage de Blessing & Tevin !\n\n` +
                    `Je m'appelle ${guestName} et je suis invité(e) à leur célébration le 27 décembre 2025.\n\n` +
                    `💝 Rendez-vous sur le site pour réserver votre place !\n` +
                    `https://mariage-blessing-tevin.vercel.app`;
            }

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

            window.open(whatsappUrl, "_blank");
        });
        console.log('✅ Bouton partage configuré');
    }

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