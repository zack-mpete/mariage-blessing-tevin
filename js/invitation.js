// Fonction pour récupérer les données de réservation (MAJ)
function getReservationData() {
    try {
        console.log('Récupération des données de réservation...');

        // Essayer d'abord sessionStorage (pour les données récentes)
        let reservationData = sessionStorage.getItem('reservationData');

        // Si pas dans sessionStorage, essayer localStorage
        if (!reservationData) {
            console.log('Pas de données dans sessionStorage, vérification localStorage...');
            const inviteName = localStorage.getItem('inviteName');
            if (inviteName) {
                reservationData = JSON.stringify({
                    nom: inviteName,
                    date: new Date().toISOString(),
                    timestamp: Date.now()
                });
                // Sauvegarder aussi dans sessionStorage pour les prochaines utilisations
                sessionStorage.setItem('reservationData', reservationData);
            }
        }

        if (reservationData) {
            const data = JSON.parse(reservationData);
            console.log('✅ Données récupérées:', data);
            return data;
        }

        console.warn('⚠️ Aucune donnée de réservation trouvée');
        return null;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
        return null;
    }
}

// Fonction pour afficher le nom (MAJ)
function displayReservationInfo() {
    try {
        const data = getReservationData();

        if (!data) {
            console.log('Utilisation des valeurs par défaut');
            // Définir un nom par défaut si aucun nom n'est trouvé
            const defaultName = "Cher(e) invité(e)";
            this.updateNameInUI(defaultName);
            return;
        }

        // Afficher le nom
        if (data.nom) {
            this.updateNameInUI(data.nom);
        }

    } catch (error) {
        console.error('Erreur lors de l\'affichage des informations:', error);
        // En cas d'erreur, mettre un nom par défaut
        this.updateNameInUI("Cher(e) invité(e)");
    }
}

// Fonction pour mettre à jour le nom dans l'interface (nouvelle)
function updateNameInUI(name) {
    console.log('Mise à jour du nom dans l\'UI:', name);

    // Mettre à jour le nom principal
    const nameElement = document.getElementById('guest-name');
    if (nameElement) {
        nameElement.textContent = name;
        console.log('✅ Nom principal affiché:', name);
    }

    // Mettre à jour le titre de bienvenue
    const welcomeTitle = document.getElementById('welcome-title');
    if (welcomeTitle) {
        welcomeTitle.textContent = `🎉 Bienvenue ${name} ! 🎉`;
    }

    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Nous sommes ravis de vous accueillir sur votre invitation personnelle.`;
    }

    // Mettre à jour l'attribut nom dans le texte
    const nomElements = document.querySelectorAll('.nom');
    nomElements.forEach(el => {
        if (el.id !== 'guest-name') { // Ne pas toucher à celui qu'on vient de mettre à jour
            el.textContent = name;
        }
    });
}

// Fonction pour debug (à supprimer en production)
function debugStorage() {
    console.log('=== DEBUG STORAGE ===');
    console.log('sessionStorage reservationData:', sessionStorage.getItem('reservationData'));
    console.log('localStorage inviteName:', localStorage.getItem('inviteName'));
    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('=====================');
}

// Fonction pour tester la récupération du nom (à supprimer en production)
function testNameRetrieval() {
    console.log('=== TEST NAME RETRIEVAL ===');
    const testName = "Jean Dupont";

    // Simuler une sauvegarde
    const testData = {
        nom: testName,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };

    sessionStorage.setItem('reservationData', JSON.stringify(testData));
    localStorage.setItem('inviteName', testName);

    console.log('Données de test sauvegardées');

    // Tester la récupération
    const retrievedData = getReservationData();
    console.log('Données récupérées:', retrievedData);

    // Tester l'affichage
    displayReservationInfo();
    console.log('=== FIN TEST ===');
}

// Fonction pour capturer l'invitation complète
function captureInvitation() {
    return new Promise((resolve, reject) => {
        try {
            // Cibler uniquement la section invitation principale
            const invitationSection = document.querySelector('.invit-page .conteneur');

            if (!invitationSection) {
                reject(new Error('Section invitation non trouvée'));
                return;
            }

            console.log('Capture de l\'invitation...');

            // Cloner la section pour éviter d'affecter le style original
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

            pdf.setProperties({
                title: `Invitation Mariage - ${guestName}`,
                subject: 'Invitation au mariage de Blessing & Tevin',
                author: 'Blessing & Tevin',
                keywords: 'mariage, invitation',
                creator: 'Site Mariage B&T'
            });

            const fileName = generateFileName(guestName);
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
            console.error('Erreur lors de la capture:', error);
            alert('Erreur lors de la génération du PDF');

            if (downloadBtn) {
                downloadBtn.querySelector('.btn-text').textContent = originalText;
                downloadBtn.disabled = false;
            }
        });

    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
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
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <img src="${imgData}" alt="Invitation de mariage">
                        <div class="print-info">
                            <p>Invitation personnelle pour: ${guestName}</p>
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
            console.error('Erreur lors de l\'impression:', error);
            alert('Erreur lors de la préparation de l\'impression');

            if (printBtn) {
                printBtn.querySelector('.btn-text').textContent = originalText;
                printBtn.disabled = false;
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'impression:', error);
        alert('Erreur lors de l\'impression');
    }
}

// Fonction pour générer un nom de fichier propre
function generateFileName(guestName) {
    const sanitizedName = guestName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    const date = new Date().toISOString().split('T')[0];

    if (sanitizedName && sanitizedName !== 'invite') {
        return `invitation-mariage-${sanitizedName}-${date}.pdf`;
    }

    return `invitation-mariage-${date}.pdf`;
}

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎉 Initialisation de la page d\'invitation...');

    // Afficher le debug storage (à supprimer en production)
    debugStorage();

    // Afficher les informations de réservation
    displayReservationInfo();

    // Configurer les boutons d'action
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
            const message =
                `🎉 Je viens de recevoir mon invitation personnelle pour le mariage de Blessing & Tevin !\n\n` +
                `Je m'appelle ${guestName} et je suis invité(e) à leur célébration le 27 décembre 2025.\n\n` +
                `💝 Rendez-vous sur le site pour réserver votre place !`;

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