document.addEventListener('DOMContentLoaded', function () {
    const formAvis = document.getElementById('formAvis');
    const messagesContainer = document.querySelector('.messages');

    // Charger les messages existants depuis le stockage local
    function loadMessages() {
        const messages = JSON.parse(localStorage.getItem('livreDorMessages')) || [];
        displayMessages(messages);
    }

    // Afficher les messages
    function displayMessages(messages) {
        messagesContainer.innerHTML = '';

        // Trier les messages par date (du plus récent au plus ancien)
        messages.sort((a, b) => new Date(b.date) - new Date(a.date));

        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.innerHTML = `
                <div class="message-header">
                    <span class="message-author">${message.nom}</span>
                    <span class="message-date">${formatDate(message.date)}</span>
                </div>
                <div class="message-content">${message.message}</div>
            `;
            messagesContainer.appendChild(messageElement);
        });
    }

    // Formater la date
    function formatDate(dateString) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    }

    // Gérer la soumission du formulaire
    if (formAvis) {
        formAvis.addEventListener('submit', function (e) {
            e.preventDefault();

            const nom = document.getElementById('nom').value.trim();
            const message = document.getElementById('message').value.trim();

            if (nom && message) {
                // Récupérer les messages existants
                const messages = JSON.parse(localStorage.getItem('livreDorMessages')) || [];

                // Ajouter le nouveau message
                messages.push({
                    nom: nom,
                    message: message,
                    date: new Date().toISOString()
                });

                // Enregistrer dans le stockage local
                localStorage.setItem('livreDorMessages', JSON.stringify(messages));

                // Mettre à jour l'affichage
                displayMessages(messages);

                // Réinitialiser le formulaire
                formAvis.reset();

                // Faire défiler jusqu'au nouveau message
                window.scrollTo({
                    top: messagesContainer.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Charger les messages au chargement de la page
    loadMessages();
});
