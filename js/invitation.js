// Fonction pour récupérer les données de réservation
function getReservationData() {
    try {
        console.log('Récupération des données de réservation...');
        const reservationData = sessionStorage.getItem('reservationData');

        if (reservationData) {
            const data = JSON.parse(reservationData);
            console.log('Données récupérées:', data);
            return data;
        }

        console.warn('Aucune donnée de réservation trouvée');
        return null;
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        return null;
    }
}

// Fonction pour afficher le nom et les boissons
function displayReservationInfo() {
    try {
        const data = getReservationData();

        if (!data) {
            console.log('Utilisation des valeurs par défaut');
            return;
        }

        // Afficher le nom
        if (data.nom) {
            const nameElement = document.getElementById('guest-name');
            if (nameElement) {
                nameElement.textContent = data.nom;
                console.log('Nom affiché:', data.nom);
            }

            // Mettre à jour le titre de bienvenue
            const welcomeTitle = document.getElementById('welcome-title');
            if (welcomeTitle) {
                welcomeTitle.textContent = `🎉 Bienvenue ${data.nom} ! 🎉`;
            }

            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Nous sommes ravis de vous accueillir sur votre invitation personnelle.`;
            }
        }

        // Afficher les boissons
        if (data.boissons && data.boissons.length > 0) {
            const boissonsElement = document.getElementById('boissons-selectionnees');
            if (boissonsElement) {
                const boissonsText = data.boissons.join(', ');
                boissonsElement.innerHTML = `<strong>Boissons préférées :</strong> ${boissonsText}`;
                console.log('Boissons affichées:', data.boissons);
            }
        }

    } catch (error) {
        console.error('Erreur lors de l\'affichage des informations:', error);
    }
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
                width: 794px; /* Largeur A4 en pixels (210mm) */
                padding: 40px;
                background: white;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            `;

            document.body.appendChild(clone);

            html2canvas(clone, {
                scale: 2, // Haute qualité pour impression
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: true,
                onclone: (document, element) => {
                    // Appliquer des styles optimisés pour la capture
                    element.style.width = '794px';
                    element.style.boxSizing = 'border-box';

                    // S'assurer que tous les éléments sont visibles
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

        // Mettre à jour le texte du bouton
        if (downloadBtn) {
            downloadBtn.querySelector('.btn-text').textContent = 'Génération en cours...';
            downloadBtn.disabled = true;
        }

        captureInvitation().then(canvas => {
            const data = getReservationData();
            const guestName = data?.nom || 'Invité';

            // Créer le PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Convertir le canvas en image
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Calculer les dimensions pour s'adapter à la page A4
            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight) * 0.95;
            const centerX = (pageWidth - imgWidth * ratio) / 2;
            const centerY = (pageHeight - imgHeight * ratio) / 2;

            // Ajouter l'image au PDF
            pdf.addImage(
                imgData,
                'JPEG',
                centerX,
                centerY,
                imgWidth * ratio,
                imgHeight * ratio
            );

            // Ajouter des métadonnées
            pdf.setProperties({
                title: `Invitation Mariage - ${guestName}`,
                subject: 'Invitation au mariage de Blessing & Tevin',
                author: 'Blessing & Tevin',
                keywords: 'mariage, invitation',
                creator: 'Site Mariage B&T'
            });

            // Générer le nom de fichier
            const fileName = generateFileName(guestName);

            // Télécharger le PDF
            pdf.save(fileName);

            // Réinitialiser le bouton
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

        // Mettre à jour le texte du bouton
        if (printBtn) {
            printBtn.querySelector('.btn-text').textContent = 'Préparation...';
            printBtn.disabled = true;
        }

        captureInvitation().then(canvas => {
            const data = getReservationData();
            const guestName = data?.nom || 'Invité';

            // Créer une nouvelle fenêtre pour l'impression
            const printWindow = window.open('', '_blank', 'width=800,height=600');

            if (!printWindow) {
                alert('Veuillez autoriser les pop-ups pour l\'impression');
                if (printBtn) {
                    printBtn.querySelector('.btn-text').textContent = originalText;
                    printBtn.disabled = false;
                }
                return;
            }

            // Préparer le contenu HTML pour l'impression
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

            // Réinitialiser le bouton après impression
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
    console.log('Initialisation de la page d\'invitation...');

    // Afficher les informations de réservation
    displayReservationInfo();

    // Configurer les boutons d'action
    const downloadBtn = document.getElementById('download-btn');
    const printBtn = document.getElementById('print-btn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadInvitationPDF);
        console.log('Bouton téléchargement configuré');
    }

    if (printBtn) {
        printBtn.addEventListener('click', printInvitation);
        console.log('Bouton impression configuré');
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