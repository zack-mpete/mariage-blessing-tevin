// Fonction pour capturer et télécharger l'image en PDF
function downloadImage() {
    try {
        const imgElement = document.querySelector('.invit-page img');

        if (!imgElement) {
            alert('Image non trouvée');
            return;
        }

        // Vérifier si jsPDF est disponible (avec la bonne syntaxe)
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            alert('Erreur: La bibliothèque PDF n\'est pas chargée. Veuillez recharger la page.');
            return;
        }

        // Utiliser html2canvas pour capturer uniquement l'image
        html2canvas(imgElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            // Convertir le canvas en image data
            const imageData = canvas.toDataURL('image/jpeg', 0.95);

            // Utiliser jsPDF (la variable globale peut être jsPDF ou jspdf)
            const PDFLib = window.jsPDF || window.jspdf.jsPDF;

            // Créer un PDF avec les dimensions correctes
            const pdf = new PDFLib({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Calculer les dimensions pour remplir la page A4
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight) * 0.95;
            const centerX = (pageWidth - imgWidth * ratio) / 2;
            const centerY = (pageHeight - imgHeight * ratio) / 2;

            // Ajouter l'image au PDF centrée
            pdf.addImage(
                imageData,
                'JPEG',
                centerX,
                centerY,
                imgWidth * ratio,
                imgHeight * ratio,
                null,
                'FAST'
            );

            // Télécharger le PDF
            pdf.save('invitation-mariage-blessing-tevin.pdf');

        }).catch(error => {
            console.error('Erreur lors de la capture:', error);
            alert('Erreur lors de la capture de l\'image');
        });

    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        alert('Erreur lors du téléchargement');
    }
}

// Fonction pour capturer et imprimer l'image depuis l'écran
function printImage() {
    try {
        const imgElement = document.querySelector('.invit-page img');

        if (!imgElement) {
            alert('Image non trouvée');
            return;
        }

        // Utiliser html2canvas pour capturer uniquement l'image
        html2canvas(imgElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const imageData = canvas.toDataURL('image/png', 1.0);

            // Créer une fenêtre d'impression
            const printWindow = window.open('', '_blank', 'width=800,height=600');

            if (!printWindow) {
                alert('Veuillez autoriser les pop-ups pour l\'impression');
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invitation Mariage - Blessing & Tevin</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh;
                            background: white;
                        }
                        .print-container {
                            text-align: center;
                        }
                        img { 
                            max-width: 100%; 
                            max-height: 90vh;
                            object-fit: contain;
                        }
                        @media print {
                            body { 
                                padding: 0; 
                                margin: 0;
                            }
                            .print-container { 
                                margin: 0;
                                padding: 0;
                            }
                            img {
                                width: 100%;
                                height: auto;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <img src="${imageData}" alt="Invitation de mariage Blessing & Tevin">
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();

            // Attendre que l'image soit chargée avant d'imprimer
            printWindow.onload = function () {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };

        }).catch(error => {
            console.error('Erreur lors de la capture:', error);
            alert('Erreur lors de la capture pour l\'impression');
        });

    } catch (error) {
        console.error('Erreur lors de l\'impression:', error);
        alert('Erreur lors de l\'impression');
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
    const downloadBtn = document.querySelector('.download-btn');
    const printBtn = document.querySelector('.print-btn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    } else {
        console.warn('Bouton de téléchargement non trouvé');
    }

    if (printBtn) {
        printBtn.addEventListener('click', printImage);
    } else {
        console.warn('Bouton d\'impression non trouvé');
    }
});