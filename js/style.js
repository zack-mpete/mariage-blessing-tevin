document.addEventListener('DOMContentLoaded', function () {
    // Récupérer les éléments du DOM
    const menuIcon = document.querySelector('.menuIcon');
    const nav = document.querySelector('nav');
    const overlay = document.createElement('div');

    // Ajouter l'overlay au body
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);

    // Fonction pour basculer le menu
    function toggleMenu() {
        nav.classList.toggle('active');
        overlay.classList.toggle('active');

        // Empêcher le défilement du corps lorsque le menu est ouvert
        if (nav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            menuIcon.appendChild = 'X';
        } else {
            document.body.style.overflow = '';
            menuIcon.appendChild = '☰';
        }
    }

    // Événement de clic sur l'icône du menu
    menuIcon.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMenu();
    });

    // Fermer le menu en cliquant sur l'overlay
    overlay.addEventListener('click', function () {
        toggleMenu();
    });

    // Fermer le menu en cliquant sur un lien du menu
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                toggleMenu();
            }
        });
    });

    // Fermer le menu lors du redimensionnement de la fenêtre
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            nav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});