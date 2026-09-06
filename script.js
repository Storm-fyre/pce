// script.js - Pearl Crown Events

document.addEventListener("DOMContentLoaded", () => {

    // 1. Current Year in Footer
    const yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // =========================================================
    // SECRET ADMIN TRIPLE-TAP TRIGGER
    // =========================================================
    let tapCount = 0;
    let tapTimer = null;
    const secretTrigger = document.getElementById("secret-admin-trigger");
    
    if (secretTrigger) {
        secretTrigger.addEventListener("click", () => {
            tapCount++;
            if (tapCount === 1) {
                tapTimer = setTimeout(() => { tapCount = 0; }, 1500);
            }
            if (tapCount === 3) {
                clearTimeout(tapTimer);
                tapCount = 0;
                window.location.href = "admin.html"; // Secret Admin Portal
            }
        });
    }

    // =========================================================
    // MOBILE NAVIGATION DRAWER
    // =========================================================
    const menuToggle = document.getElementById("mobile-menu");
    const navbar = document.getElementById("navbar");

    if (menuToggle && navbar) {
        menuToggle.addEventListener("click", () => {
            navbar.classList.toggle("active");
        });
    }

    // =========================================================
    // DATA CACHE & INITIALIZATION
    // =========================================================
    loadHomepageHighlights();
    preloadServicesData();
});

// Cache for all service write-ups
let servicesDataCache = {};
let lastScrollPosition = 0;

// XSS Sanitizer Helper
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
    }[tag] || tag));
}

// Preload service data for instant clicks
async function preloadServicesData() {
    try {
        const res = await fetch("/api/services");
        if (res.ok) {
            const data = await res.json();
            data.forEach(item => {
                servicesDataCache[item.id] = item;
            });
        }
    } catch (e) {
        console.error("Could not preload services:", e);
    }
}

// =========================================================
// HOMEPAGE HIGHLIGHTS LOADER
// =========================================================
async function loadHomepageHighlights() {
    const grid = document.getElementById("homepage-highlights-grid");
    if (!grid) return;

    try {
        const res = await fetch("/api/gallery?highlights=1");
        if (!res.ok) throw new Error("Failed to fetch highlights");
        const photos = await res.json();

        if (photos && photos.length > 0) {
            grid.innerHTML = photos.map(photo => `
                <div class="gallery-item">
                    <img src="${escapeHTML(photo.image_url)}" alt="Ceremony Highlight" loading="lazy">
                </div>
            `).join("");
        } else {
            // Elegant fallback if no highlights are marked yet
            grid.innerHTML = `
                <div class="gallery-item"><img src="https://images.unsplash.com/photo-1519225468359-2996bc010854?w=600&q=80" alt="Highlight"></div>
                <div class="gallery-item"><img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80" alt="Highlight"></div>
                <div class="gallery-item"><img src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80" alt="Highlight"></div>
                <div class="gallery-item"><img src="https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&q=80" alt="Highlight"></div>
            `;
        }
    } catch (err) {
        grid.innerHTML = "<p style='text-align: center; color: #888; grid-column: 1/-1;'>Highlights gallery will appear here shortly.</p>";
    }
}

// =========================================================
// DYNAMIC SERVICE VIEW ENGINE
// =========================================================
async function openService(serviceId) {
    // 1. Save scroll position before leaving homepage
    lastScrollPosition = window.scrollY;

    const homeView = document.getElementById("home-view");
    const serviceView = document.getElementById("service-view");
    const titleEl = document.getElementById("dynamic-service-title");
    const descEl = document.getElementById("dynamic-service-description");
    const galleryGrid = document.getElementById("dynamic-service-gallery");
    const navbar = document.getElementById("navbar");

    if (navbar) navbar.classList.remove("active");

    // 2. Switch Views
    homeView.classList.add("hidden");
    serviceView.classList.remove("hidden");
    window.scrollTo(0, 0);

    // 3. Render Title & Description
    const cached = servicesDataCache[serviceId];
    if (cached) {
        titleEl.textContent = cached.title;
        descEl.textContent = cached.description || "Every detail curated with royal excellence.";
    } else {
        // Fallback fetch if not yet in cache
        titleEl.textContent = "Loading Ceremony...";
        descEl.textContent = "";
        try {
            const res = await fetch(`/api/services?id=${serviceId}`);
            const data = await res.json();
            if (data) {
                servicesDataCache[serviceId] = data;
                titleEl.textContent = data.title;
                descEl.textContent = data.description || "";
            }
        } catch (e) {
            titleEl.textContent = "Ceremony Details";
        }
    }

    // 4. Fetch and Render Gallery Photos from R2
    galleryGrid.innerHTML = "<p style='text-align: center; grid-column: 1/-1; color: #777;'>Loading gallery...</p>";
    try {
        const res = await fetch(`/api/gallery?service_id=${serviceId}`);
        const photos = await res.json();

        if (photos && photos.length > 0) {
            galleryGrid.innerHTML = photos.map(p => `
                <div class="gallery-item">
                    <img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(titleEl.textContent)}" loading="lazy">
                </div>
            `).join("");
        } else {
            galleryGrid.innerHTML = `
                <div style="text-align: center; grid-column: 1/-1; padding: 40px 20px; background: #fdfbf7; border-radius: 8px; border: 1px dashed var(--accent-gold);">
                    <i class="fas fa-camera" style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 12px; display: block;"></i>
                    <h3 style="color: var(--primary-blue); margin-bottom: 8px;">Portfolio Photos Coming Soon</h3>
                    <p style="color: #666; max-width: 500px; margin: 0 auto;">We are currently updating our portfolio for this celebration. Contact us directly to view our latest event albums!</p>
                </div>
            `;
        }
    } catch (e) {
        galleryGrid.innerHTML = "<p style='text-align: center; grid-column: 1/-1; color: #888;'>Unable to load gallery photos at this moment.</p>";
    }

    // 5. Update Browser History for physical back button
    history.pushState({ view: "service", id: serviceId }, "", "#" + serviceId);
}

// Return to Homepage
function navigateToHome(scrollToId = null) {
    const homeView = document.getElementById("home-view");
    const serviceView = document.getElementById("service-view");
    const navbar = document.getElementById("navbar");

    if (navbar) navbar.classList.remove("active");

    serviceView.classList.add("hidden");
    homeView.classList.remove("hidden");

    if (scrollToId) {
        const target = document.getElementById(scrollToId);
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth" });
            }, 50);
        }
    } else {
        setTimeout(() => {
            window.scrollTo({ top: lastScrollPosition, behavior: "smooth" });
        }, 10);
    }

    if (history.state && history.state.view === "service") {
        history.pushState({ view: "home" }, "", " ");
    }
}

// "Enquire Now" from inside a service
function enquireNow() {
    navigateToHome("contact");
}

// Handle Browser Back Button
window.onpopstate = function(event) {
    if (event.state && event.state.view === "service") {
        openService(event.state.id);
    } else {
        const homeView = document.getElementById("home-view");
        const serviceView = document.getElementById("service-view");
        serviceView.classList.add("hidden");
        homeView.classList.remove("hidden");
    }
};

// =========================================================
// CONTACT FORM: EMAILJS + CLOUDFLARE D1 INQUIRIES
// =========================================================
const modal = document.getElementById("successModal");
function closeModal() {
    if (modal) modal.classList.remove("active");
}

async function submitForm(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    btn.innerText = "Sending Request...";
    btn.disabled = true;

    // Collect data for database backup
    const formData = new FormData(form);
    const inquiryPayload = {
        user_name: formData.get("user_name"),
        phone_number: formData.get("phone_number"),
        event_type: formData.get("event_type"),
        message: formData.get("message")
    };

    try {
        // 1. Save permanent backup copy in D1 Database
        fetch("/api/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inquiryPayload)
        }).catch(err => console.warn("D1 backup notice:", err));

        // 2. Send instant notification email via EmailJS
        await emailjs.sendForm("service_fgzclff", "template_936ae1v", "#bookingForm");

        // Success
        btn.innerText = originalText;
        btn.disabled = false;
        form.reset();
        if (modal) modal.classList.add("active");

    } catch (err) {
        console.error("Submission error:", err);
        btn.innerText = originalText;
        btn.disabled = false;
        alert("Unable to send request online. Please call us directly at +91 73868 79771.");
    }
}