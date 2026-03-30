/**
 * main.js - Global App Logic (Navigation, Theme Toggle)
 */

document.addEventListener("DOMContentLoaded", () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            if (targetId) scrollToSection(targetId);

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle');

    const htmlElement = document.documentElement;

    function toggleTheme() {
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    }

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener('click', toggleTheme);

    // Initial check for user preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        htmlElement.classList.remove('dark');
    } else {
        // Default to dark as per PRD
        htmlElement.classList.add('dark');
    }

    // Initialize Waveform on Hero (Canvas)
    initHeroWaveform();
});

// Scroll helper
window.scrollToSection = function (sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        window.scrollTo({
            top: section.offsetTop - 64, // Accounts for sticky navbar (h-16 = 64px)
            behavior: 'smooth'
        });
    }
}

// Simple Hero Canvas Animation
function initHeroWaveform() {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Resize
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Draw Loop
    let time = 0;
    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        const yOffset = canvas.height / 2;
        ctx.moveTo(0, yOffset);

        for (let i = 0; i < canvas.width; i += 5) {
            // Complex wave
            const wave1 = Math.sin(i * 0.01 + time) * 30;
            const wave2 = Math.sin(i * 0.02 - time * 1.5) * 20;
            const wave3 = Math.sin(i * 0.005 + time * 0.5) * 50;
            const y = yOffset + wave1 + wave2 + wave3;
            ctx.lineTo(i, y);
        }

        // Decide color based on theme
        const isDark = document.documentElement.classList.contains('dark');
        ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.6)'; // Indigo (more opaque)
        ctx.lineWidth = 4.5;
        ctx.stroke();

        time += 0.02;
        requestAnimationFrame(draw);
    };

    draw();
}
