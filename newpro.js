document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.menu-btn');
    const navContainer = document.querySelector('.nav-links');
    
    menuBtn.addEventListener('click', function() {
        menuBtn.classList.toggle('active');
        navContainer.classList.toggle('active');
    });
    
    // Close mobile menu when clicking a link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navContainer.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const nav = document.querySelector('nav');
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    // Smooth scrolling / slide navigation for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const targetId = href.startsWith('#') ? href : `#${href}`;
            const targetElement = document.querySelector(targetId);

            // If the target is one of the slide sections, activate it via showSlide to avoid
            // scrolling to elements that may be hidden by the slide system.
            if (targetElement && targetElement.classList && targetElement.classList.contains('slide')) {
                e.preventDefault();
                if (typeof showSlide === 'function') {
                    showSlide(targetId);
                    try { history.replaceState(null, '', targetId); } catch (err) {}
                    // Small delay to let the slide become visible, then smooth-scroll into view
                    setTimeout(() => { targetElement.scrollIntoView({ behavior: 'smooth' }); }, 150);
                }
                return;
            }

            if (targetElement) {
                e.preventDefault();
                const top = targetElement.offsetTop - 80;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
    
    // Portfolio filter
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            
            portfolioItems.forEach(item => {
                item.style.display = (filterValue === 'all' || item.dataset.category === filterValue)
                    ? 'block'
                    : 'none';
            });
        });
    });
    
    // Slide navigation and Section Visibility
    const slides = document.querySelectorAll('.slide');
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: unobserve after first intersection
                // obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    slides.forEach(slide => {
        observer.observe(slide);
    });
    
    function showSlide(slideId) {
        // Scroll the target slide into view instead of toggling display classes.
        const targetSlide = document.querySelector(slideId);
        if (targetSlide) {
            // Use smooth scrolling and align to start; scroll-margin-top handles nav offset.
            targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
            try { history.replaceState(null, '', slideId); } catch (e) { /* ignore */ }
        }

        // Update nav active state
        navItems.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === slideId);
        });
    }
    
    // Initialize first slide
    showSlide('#home');
    
    // Handle nav link clicks for slides
    navItems.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showSlide(this.getAttribute('href'));
        });
    });
    
    // Scroll down button
    const scrollDownBtn = document.querySelector('.scroll-down');
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Use the slide navigation helper so the #about slide becomes active (visible)
            if (typeof showSlide === 'function') {
                showSlide('#about');
                // Update hash without jumping (keeps browser history tidy)
                try { history.replaceState(null, '', '#about'); } catch (err) { /* ignore */ }

                // After the slide becomes active, perform a subtle smooth scroll to the section
                // Delay briefly to allow the DOM/layout to update when the slide becomes visible
                setTimeout(() => {
                    const aboutSection = document.querySelector('#about');
                    if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 200);
            } else {
                // Fallback: smooth scroll to element if showSlide isn't available
                const aboutSection = document.querySelector('#about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // Support keyboard activation (Enter / Space) for accessibility
        scrollDownBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }

    // Keep nav 'active' in sync while the user scrolls (highlight the section currently in view)
    (function syncNavWithScroll() {
        // Determine the most visible slide using intersection ratios
        const activeObserver = new IntersectionObserver((entries) => {
            let mostVisible = null;
            entries.forEach(entry => {
                if (!mostVisible || entry.intersectionRatio > mostVisible.intersectionRatio) {
                    mostVisible = entry;
                }
            });

            if (mostVisible && mostVisible.isIntersecting) {
                const id = mostVisible.target.id;
                const slideHash = `#${id}`;
                // Update nav link active state
                navItems.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === slideHash);
                });
                // Optionally update the URL hash without jumping
                try { history.replaceState(null, '', slideHash); } catch (err) { /* ignore */ }
            }
        }, { threshold: [0.25, 0.5, 0.75] });

        slides.forEach(s => activeObserver.observe(s));
    })();

    // Enable keyboard navigation between slides (wheel snapping disabled by default to keep native scrolling)
    (function enableScrollKeyboardNav() {
        // Set to true if you want wheel-to-slide snapping (not recommended for native scrolling)
        const enableWheelSnap = false;
        let isThrottled = false;
        const throttleDelay = 700; // ms

        function getCurrentSlideIndex() {
            const active = Array.from(slides).findIndex(s => s.classList.contains('active'));
            return active >= 0 ? active : 0;
        }

        function showByIndex(index) {
            index = Math.max(0, Math.min(slides.length - 1, index));
            const id = slides[index].id;
            showSlide(`#${id}`);
        }

        // Wheel-to-slide snapping is optional and disabled to preserve default/native scrolling behavior.
        if (enableWheelSnap) {
            window.addEventListener('wheel', (e) => {
                if (isThrottled) return;
                const delta = e.deltaY;
                const cur = getCurrentSlideIndex();
                if (delta > 0 && cur < slides.length - 1) showByIndex(cur + 1);
                else if (delta < 0 && cur > 0) showByIndex(cur - 1);

                isThrottled = true;
                setTimeout(() => isThrottled = false, throttleDelay);
            }, { passive: true });
        }

        // Keep keyboard navigation for accessibility and power users
        window.addEventListener('keydown', (e) => {
            if (['ArrowDown', 'PageDown'].includes(e.key)) {
                e.preventDefault();
                showByIndex(getCurrentSlideIndex() + 1);
            } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
                e.preventDefault();
                showByIndex(getCurrentSlideIndex() - 1);
            } else if (e.key === 'Home') {
                e.preventDefault();
                showByIndex(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                showByIndex(slides.length - 1);
            }
        });
    })();
    
    // Animate progress bars when skills section comes into view
    const skillsSection = document.querySelector('#skills');
    const progressBars = document.querySelectorAll('.progress');
    
    function animateProgressBars() {
        progressBars.forEach(bar => {
            const targetWidth = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => bar.style.width = targetWidth, 100);
        });
    }
    
    if (skillsSection) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateProgressBars();
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        observer.observe(skillsSection);
    }
    
    // Form submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const data = Object.fromEntries(new FormData(this));
            console.log('Form submitted:', data);
            
            alert('Thank you for your message! I will get back to you soon.');
            this.reset();
        });
    }

    // Initialize Particles.js
    if(document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles": { "number": { "value": 60, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#6a5acd" }, "shape": { "type": "circle" }, "opacity": { "value": 0.4, "random": true }, "size": { "value": 4, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#8892b0", "opacity": 0.3, "width": 1 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": true, "straight": false, "out_mode": "out" } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } }, "modes": { "grab": { "distance": 140, "line_opacity": 1 }, "push": { "particles_nb": 4 } } }, "retina_detect": true
        });
    }
});
