/**
 * ==========================================================================
 * RIALTO CONSULTORES S.A.C. - CONTROLADOR JAVASCRIPT PRINCIPAL (PRODUCCIÓN)
 * Desarrollado por Tecno Insane (https://tecnoinsane.net.pe)
 * Versión: 5.0 (Layout SPA Líquido - Nodos en RAM + Micro-Fading a 0ms)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Almacén en RAM para los nodos DOM ya procesados y listos para inyección
    const pageDOMCache = {};

    // 1. INICIALIZAR COMPONENTES PERMANENTES (Solo se ejecutan una vez en el Layout)
    initMobileMenu();
    initThemeToggle();
    initServicesSlider();

    // Capturar el nombre del archivo actual
    const currentFilename = window.location.pathname.split('/').pop() || 'index.html';
    
    // Guardar la página de aterrizaje en la caché de nodos inmediatos
    pageDOMCache[currentFilename] = {
        mainContent: document.querySelector('main').cloneNode(true),
        title: document.title
    };

    // Index de páginas autorizadas para precarga silenciosa
    const sitePages = ['index.html', 'quienes-somos.html', 'servicios.html', 'clientes.html', 'contacto.html'];

    /**
     * Motor de absorción: Descarga y pre-construye los árboles DOM en RAM
     */
    const prefetchPagesToDOMCache = async () => {
        for (const page of sitePages) {
            if (page !== currentFilename && !pageDOMCache[page]) {
                try {
                    const response = await fetch(page);
                    if (response.ok) {
                        const htmlText = await response.text();
                        const parser = new DOMParser();
                        const virtualDoc = parser.parseFromString(htmlText, 'text/html');
                        const mainNode = virtualDoc.querySelector('main');
                        
                        if (mainNode) {
                            pageDOMCache[page] = {
                                mainContent: mainNode.cloneNode(true),
                                title: virtualDoc.title
                            };
                        }
                    }
                } catch (e) {
                    console.warn(`Precarga optimizada suspendida para: ${page}`);
                }
            }
        }
    };

    // Lanzar la precarga en RAM de forma pasiva a los 300ms de iniciar la web
    setTimeout(prefetchPagesToDOMCache, 300);


    // ==========================================================================
    // 2. ENRUTADOR DE ALTA VELOCIDAD POR INTERCAMBIO DE NODOS
    // ==========================================================================
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.getAttribute('href') || link.getAttribute('target') === '_blank') return;

        const href = link.getAttribute('href');

        if (href.endsWith('.html') && !href.startsWith('http') && !href.startsWith('//')) {
            e.preventDefault(); // Bloquear la recarga física destructiva del navegador
            
            const targetFile = href.split('/').pop() || 'index.html';
            
            if (pageDOMCache[targetFile]) {
                executeLayoutTransition(targetFile, href, true);
            } else {
                window.location.href = href; // Respaldo tradicional si la RAM no está lista
            }
        }
    });

    // Controlar botones nativos del sistema (Atrás / Adelante)
    window.addEventListener('popstate', () => {
        const targetFile = window.location.pathname.split('/').pop() || 'index.html';
        if (pageDOMCache[targetFile]) {
            executeLayoutTransition(targetFile, window.location.pathname, false);
        }
    });

    /**
     * Realiza el desvanecimiento veloz y cambia los elementos sin refundición de texto
     */
    function executeLayoutTransition(file, fullUrl, updateHistory) {
        const mainElement = document.querySelector('main');
        if (!mainElement) return;

        // Fase A: Desvanecer la vista actual de forma ultra fluida (120ms)
        mainElement.classList.add('layout-switching');

        setTimeout(() => {
            // Fase B: Intercambio instantáneo de Nodos limpios en memoria RAM (0ms de lectura)
            mainElement.innerHTML = ''; 
            const cachedClone = pageDOMCache[file].mainContent.cloneNode(true);
            
            // Mover los hijos del nodo clonado hacia el contenedor principal visible
            while (cachedClone.firstChild) {
                mainElement.appendChild(cachedClone.firstChild);
            }

            document.title = pageDOMCache[file].title;

            if (updateHistory) {
                history.pushState(null, '', fullUrl);
            }

            // Sincronizar el estado visual del menú activo en el Layout
            updateActiveMenuLink(file);

            // Re-inicializar controladores internos específicos (Como el slider de la vista servicios)
            initServicesSlider();

            // Auto-cerrar menú móvil si el usuario estaba navegando en celular
            const navMenu = document.getElementById('navMenu');
            const menuIcon = document.querySelector('#menuToggle i');
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (menuIcon) menuIcon.className = 'ph ph-list';
            }

            // Subir el scroll de inmediato antes de re-aparecer la pantalla
            window.scrollTo({ top: 0, behavior: 'instant' });

            // Fase C: Re-aparecer el nuevo contenido de forma líquida y elegante
            mainElement.classList.remove('layout-switching');

        }, 120); // Tiempo de espera sincronizado perfectamente con el CSS transition
    }

    function updateActiveMenuLink(filename) {
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === filename);
        });
    }


    // ==========================================================================
    // 3. ENCAPSULADOS DE MÓDULOS DE COMPONENTES
    // ==========================================================================
    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        if (!menuToggle || !navMenu) return;

        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            icon.className = navMenu.classList.contains('active') ? 'ph ph-x' : 'ph ph-list';
        });
    }

    function initThemeToggle() {
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (!themeToggleBtn) return;

        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            const icon = themeToggleBtn.querySelector('i');
            if (icon) icon.className = newTheme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
        });
    }

    function initServicesSlider() {
        const slider = document.querySelector('.slider-wrapper');
        const btnLeft = document.getElementById('slideLeft');
        const btnRight = document.getElementById('slideRight');
        if (!slider || !btnLeft || !btnRight) return;

        const getScrollAmount = () => {
            const firstCard = slider.querySelector('.service-card-slide');
            return firstCard ? firstCard.clientWidth + 32 : 392;
        };

        // Clonación limpia de nodos para evitar duplicados de listeners en el enrutamiento continuo
        const newRight = btnRight.cloneNode(true);
        const newLeft = btnLeft.cloneNode(true);
        btnRight.parentNode.replaceChild(newRight, btnRight);
        btnLeft.parentNode.replaceChild(newLeft, btnLeft);

        newRight.addEventListener('click', () => {
            const maxScroll = slider.scrollWidth - slider.clientWidth;
            if (slider.scrollLeft >= maxScroll - 10) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            }
        });

        newLeft.addEventListener('click', () => {
            if (slider.scrollLeft <= 10) {
                const maxScroll = slider.scrollWidth - slider.clientWidth;
                slider.scrollTo({ left: maxScroll, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            }
        });
    }
});