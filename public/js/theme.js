// Dark Mode Toggle
(function() {
    const toggle = document.getElementById('themeToggle');
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);

    if (toggle) {
        const icon = toggle.querySelector('i');
        icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
})();

// Framer Motion Page Transitions
document.addEventListener('DOMContentLoaded', () => {
    // 1. Enter Animation: Select all main content blocks (excluding nav, scripts, and invisible elements)
    const elementsToAnimate = document.querySelectorAll('body > :not(nav):not(script):not(style)');
    
    elementsToAnimate.forEach((el, index) => {
        // Stagger the entry animation slightly for that smooth Framer feel
        el.style.animationDelay = `${index * 0.08}s`;
        el.classList.add('framer-enter');
    });

    // 2. Exit Animation: Intercept internal navigation links
    const navLinks = document.querySelectorAll('a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            const target = link.getAttribute('target');
            
            // Ignore external links, new tabs, anchors on current page, or empty links
            if (!href || target === '_blank' || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            
            const isHomePage = window.location.pathname === '/';
            const isHashLink = (href.startsWith('/#') && isHomePage) || href.startsWith('#');

            e.preventDefault(); // Stop immediate navigation
            
            // Trigger exit animation
            elementsToAnimate.forEach(el => {
                el.classList.remove('framer-enter'); // Reset enter
                el.classList.add('framer-exit');     // Trigger exit
            });
            
            // Wait for animation to complete (400ms matching CSS), then navigate
            setTimeout(() => {
                if (isHashLink) {
                    // Handle hash link on the same page
                    const targetHash = href.startsWith('/#') ? href.substring(1) : href;
                    window.location.hash = targetHash;
                    
                    // Trigger enter animation again to bring content back
                    elementsToAnimate.forEach((el, index) => {
                        el.classList.remove('framer-exit');
                        // Force a reflow so the browser restarts the animation
                        void el.offsetWidth;
                        el.style.animationDelay = `${index * 0.08}s`;
                        el.classList.add('framer-enter');
                    });
                } else {
                    // Handle normal page navigation
                    window.location.href = href;
                }
            }, 350); 
        });
    });

    // 3. Sticky Navbar Glassmorphism on Scroll
    const navbar = document.querySelector('.navbar-glass');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 4. Floating Toast Converter
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.top = '80px'; // below navbar
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '9999';
            toastContainer.style.display = 'flex';
            toastContainer.style.flexDirection = 'column';
            toastContainer.style.gap = '10px';
            document.body.appendChild(toastContainer);
        }

        const isSuccess = alert.classList.contains('alert-success');
        const text = alert.textContent.replace('×', '').replace('Close', '').replace('Peringatan!', '').replace('Berhasil!', '').trim();
        
        const toast = document.createElement('div');
        toast.className = `toast-glass ${isSuccess ? 'success' : 'error'}`;
        toast.innerHTML = `
            <i class="fas ${isSuccess ? 'fa-check-circle text-success' : 'fa-exclamation-circle text-danger'} fs-4"></i>
            <div>
                <p class="mb-0 fw-bold">${isSuccess ? 'Success' : 'Error'}</p>
                <p class="mb-0 text-secondary small">${text}</p>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        alert.remove(); // Remove original alert
        
        // Remove toast after animation ends
        setTimeout(() => {
            toast.remove();
        }, 3500);
    });
});
