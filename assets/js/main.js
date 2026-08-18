/**
 * ==========================================================================
 * RIALTO CONSULTORES S.A.C. - CONTROLADOR JAVASCRIPT PRINCIPAL (PRODUCCIÓN)
 * Desarrollado por Tecno Insane (https://tecnoinsane.net.pe)
 * Versión: 5.0 (Layout SPA Líquido - Nodos en RAM + Micro-Fading a 0ms)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Almacén en RAM para los nodos DOM ya procesados y listos para inyección
    // (Permite una navegación instantánea estilo SPA - Single Page Application)
    const pageDOMCache = {};

    // ==========================================================================
    // 1. INICIALIZAR COMPONENTES PERMANENTES 
    // (Solo se ejecutan una vez al cargar la página completa)
    // ==========================================================================
    initMobileMenu();
    initServicesSlider();
    initHeroSlider();

    // Capturar el nombre del archivo actual (ej: index.html o contacto.html)
    const currentFilename = window.location.pathname.split('/').pop() || 'index.html';
    
    // Guardar la página actual en la caché de nodos para evitar recargarla más tarde
    pageDOMCache[currentFilename] = {
        mainContent: document.querySelector('main').cloneNode(true),
        title: document.title
    };

    // Índice de páginas autorizadas para precarga silenciosa en segundo plano
    const sitePages = ['index.html', 'quienes-somos.html', 'consultores.html', 'servicios.html', 'clientes.html', 'contacto.html'];

    /**
     * Motor de absorción: Descarga y pre-construye el HTML de las otras páginas
     * en memoria RAM para que la navegación parezca instantánea.
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

    // Lanzar la precarga en RAM de forma pasiva a los 300ms de iniciar la web (no afecta el rendimiento)
    setTimeout(prefetchPagesToDOMCache, 300);


    // ==========================================================================
    // 2. ENRUTADOR DE ALTA VELOCIDAD (Intercambio de Nodos)
    // ==========================================================================
    
    // Interceptar los clics en cualquier enlace <a>
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.getAttribute('href') || link.getAttribute('target') === '_blank') return;

        const href = link.getAttribute('href');

        // Si el enlace apunta a otra página HTML local de este sitio web
        if (href.endsWith('.html') && !href.startsWith('http') && !href.startsWith('//')) {
            e.preventDefault(); // Bloquear la recarga física estándar (destructiva) del navegador
            
            const targetFile = href.split('/').pop() || 'index.html';
            
            // Si la página ya está en memoria RAM, usar transición SPA
            if (pageDOMCache[targetFile]) {
                executeLayoutTransition(targetFile, href, true);
            } else {
                // Respaldo tradicional: Si la RAM no está lista, redirigir normalmente
                window.location.href = href; 
            }
        }
    });

    // Controlar los botones nativos del sistema (Atrás / Adelante del navegador)
    window.addEventListener('popstate', () => {
        const targetFile = window.location.pathname.split('/').pop() || 'index.html';
        if (pageDOMCache[targetFile]) {
            executeLayoutTransition(targetFile, window.location.pathname, false);
        }
    });

    /**
     * Realiza el desvanecimiento rápido y cambia el contenido (<main>) 
     * usando la memoria RAM sin recargar el navegador.
     */
    function executeLayoutTransition(file, fullUrl, updateHistory) {
        const mainElement = document.querySelector('main');
        if (!mainElement) return;

        // Fase A: Ocultar suavemente la vista actual (duración 120ms según CSS)
        mainElement.classList.add('layout-switching');

        setTimeout(() => {
            // Fase B: Intercambio instantáneo de contenido en memoria RAM
            mainElement.innerHTML = ''; 
            const cachedClone = pageDOMCache[file].mainContent.cloneNode(true);
            
            // Inyectar el nuevo contenido en el contenedor principal
            while (cachedClone.firstChild) {
                mainElement.appendChild(cachedClone.firstChild);
            }

            // Cambiar el título de la pestaña del navegador
            document.title = pageDOMCache[file].title;

            // Actualizar la URL de la barra de direcciones sin recargar
            if (updateHistory) {
                history.pushState(null, '', fullUrl);
            }

            // Marcar en color verde el enlace del menú en el que estamos actualmente
            updateActiveMenuLink(file);

            // Re-inicializar los sliders para que funcionen en la nueva página cargada
            initServicesSlider();
            initHeroSlider();

            // Si el usuario navegaba en celular, cerrar el menú desplegable automáticamente
            const navMenu = document.getElementById('navMenu');
            const menuIcon = document.querySelector('#menuToggle i');
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (menuIcon) menuIcon.className = 'ph ph-list';
            }

            // Mover el usuario al tope de la página inmediatamente
            window.scrollTo({ top: 0, behavior: 'instant' });

            // Fase C: Re-aparecer el nuevo contenido de forma fluida y elegante
            mainElement.classList.remove('layout-switching');

        }, 120); // Tiempo exacto que dura la transición CSS en style.css
    }

    // Marca el botón activo del menú superior ("Inicio", "Servicios", etc.)
    function updateActiveMenuLink(filename) {
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === filename);
        });
    }


    // ==========================================================================
    // 3. ENCAPSULADOS DE MÓDULOS DE COMPONENTES (SLIDERS, MENÚ MÓVIL)
    // ==========================================================================
    
    /**
     * Control del Menú Hambuguesa en dispositivos móviles (Celulares)
     */
    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        if (!menuToggle || !navMenu) return;

        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // Intercambiar icono de menú <-> cerrar
            const icon = menuToggle.querySelector('i');
            icon.className = navMenu.classList.contains('active') ? 'ph ph-x' : 'ph ph-list';
        });
    }

    /**
     * Slider horizontal de la sección "Servicios" (Desplazamiento por flechas)
     */
    function initServicesSlider() {
        const slider = document.querySelector('.slider-wrapper');
        const btnLeft = document.getElementById('slideLeft');
        const btnRight = document.getElementById('slideRight');
        
        // Si no existen estos elementos en la página actual, detener la ejecución de esta función
        if (!slider || !btnLeft || !btnRight) return;

        // Calcular dinámicamente cuánto debe desplazarse en base al tamaño de la tarjeta
        const getScrollAmount = () => {
            const firstCard = slider.querySelector('.service-card-slide');
            return firstCard ? firstCard.clientWidth + 32 : 392;
        };

        // Clonar los botones para resetear eventos previos (evitar dobles clics por el SPA)
        const newRight = btnRight.cloneNode(true);
        const newLeft = btnLeft.cloneNode(true);
        btnRight.parentNode.replaceChild(newRight, btnRight);
        btnLeft.parentNode.replaceChild(newLeft, btnLeft);

        // Flecha Derecha
        newRight.addEventListener('click', () => {
            const maxScroll = slider.scrollWidth - slider.clientWidth;
            if (slider.scrollLeft >= maxScroll - 10) {
                slider.scrollTo({ left: 0, behavior: 'smooth' }); // Volver al inicio si ya llegó al final
            } else {
                slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }); // Mover a la derecha
            }
        });

        // Flecha Izquierda
        newLeft.addEventListener('click', () => {
            if (slider.scrollLeft <= 10) {
                const maxScroll = slider.scrollWidth - slider.clientWidth;
                slider.scrollTo({ left: maxScroll, behavior: 'smooth' }); // Ir al final si está en el inicio
            } else {
                slider.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }); // Mover a la izquierda
            }
        });
    }

    /**
     * Lógica para el Slider de la portada "Hero" (Cambio de imágenes de fondo)
     */
    function initHeroSlider() {
        const slides = document.querySelectorAll('.hero-slider .slide');
        const indicators = document.querySelectorAll('.slider-indicators .indicator');
        
        // Si no hay slides en la vista actual, detener ejecución
        if (!slides.length) return;
        
        let currentSlide = 0;
        
        // Limpiar un intervalo previo para evitar que corran dos tiempos a la vez por el SPA
        if (window.heroSliderInterval) {
            clearInterval(window.heroSliderInterval);
        }

        // Función para cambiar manualmente a una diapositiva específica
        const goToSlide = (index) => {
            slides[currentSlide].classList.remove('active');
            if(indicators.length) indicators[currentSlide].classList.remove('active');
            
            currentSlide = index;
            
            slides[currentSlide].classList.add('active');
            if(indicators.length) indicators[currentSlide].classList.add('active');
        };

        // Avanzar a la siguiente imagen
        const nextSlide = () => {
            goToSlide((currentSlide + 1) % slides.length);
        };

        // Botón físico hacia atrás
        const prevSlideBtn = () => {
            goToSlide((currentSlide - 1 + slides.length) % slides.length);
            resetInterval();
        };

        // Botón físico hacia adelante
        const nextSlideBtn = () => {
            nextSlide();
            resetInterval();
        };

        // Resetea el tiempo automático si el usuario hizo clic manualmente
        const resetInterval = () => {
            clearInterval(window.heroSliderInterval);
            window.heroSliderInterval = setInterval(nextSlide, 5000); // Automático cada 5s
        };

        const btnPrev = document.getElementById('prevSlide');
        const btnNext = document.getElementById('nextSlide');
        
        // Clonar y asignar eventos si los botones existen
        if (btnPrev && btnNext) {
            const newPrev = btnPrev.cloneNode(true);
            const newNext = btnNext.cloneNode(true);
            btnPrev.parentNode.replaceChild(newPrev, btnPrev);
            btnNext.parentNode.replaceChild(newNext, btnNext);
            
            newPrev.addEventListener('click', prevSlideBtn);
            newNext.addEventListener('click', nextSlideBtn);
        }

        // Asignar eventos a los puntitos de abajo si existen
        if (indicators.length) {
            indicators.forEach((indicator, index) => {
                const newInd = indicator.cloneNode(true);
                indicator.parentNode.replaceChild(newInd, indicator);
                newInd.addEventListener('click', () => {
                    goToSlide(index);
                    resetInterval();
                });
            });
        }

        // Arrancar el ciclo automático de imágenes
        window.heroSliderInterval = setInterval(nextSlide, 5000);
    }
});