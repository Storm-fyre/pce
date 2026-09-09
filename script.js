// script.js - Pearl Crown Events

// Master registry of all 7 Services available across events
const ALL_SERVICES = [
    { id: "venue", title: "Venue Management", icon: "fa-hotel", defaultDesc: "Layout planning, vendor coordination, power backup, and seamless on-ground guest flow." },
    { id: "planning", title: "Planning & Concept", icon: "fa-drafting-compass", defaultDesc: "Bespoke theme conceptualization, budgets, scheduling, and complete operational blueprints." },
    { id: "design", title: "Design & Decor", icon: "fa-palette", defaultDesc: "Breathtaking stage setups, grand mandaps, floral craftsmanship, and thematic ambiance lighting." },
    { id: "catering", title: "Catering Services", icon: "fa-utensils", defaultDesc: "Exquisite gourmet multi-cuisine banquets, specialty counters, and gracious royal hospitality." },
    { id: "food_stalls", title: "Food Stalls", icon: "fa-store", defaultDesc: "Live chaat counters, mocktail lounges, interactive snack stations, and artisanal dessert bars." },
    { id: "entertainment", title: "Entertainment", icon: "fa-music", defaultDesc: "Live performers, celebrity anchors, DJs, traditional musicians, and choreographed stage entries." },
    { id: "media", title: "Media Management", icon: "fa-camera-retro", defaultDesc: "Cinematic 4K wedding films, candid photography, drone coverage, and prompt album mastering." }
];

// Master registry of Celebrations / Events
const EVENT_MAP = {
    "wedding": { title: "Wedding", formVal: "Wedding" },
    "engagement": { title: "Engagement", formVal: "Engagement" },
    "anniversary": { title: "Anniversary Parties", formVal: "Anniversary" },
    "birthday": { title: "Birthday Parties", formVal: "Birthday" },
    "cradle": { title: "Cradle Ceremonies", formVal: "Cradle" },
    "bommala": { title: "Bommala Koluvu", formVal: "Bommala" },
    "sangeet": { title: "Sangeet", formVal: "Sangeet" },
    "mehandi": { title: "Mehandi Function", formVal: "Mehandi" },
    "halfsaree": { title: "Half-Saree Function", formVal: "HalfSaree" }
};

let servicesDataCache = {};
let lastScrollPosition = 0;
let currentActiveEventId = null;
let currentActiveServiceId = null;

// --- Lifecycle Initialization ---
document.addEventListener("DOMContentLoaded", () => {

    // 1. Current Year in Footer
    const yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 2. Secret Admin Triple-Tap Trigger on Logo
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
                window.location.href = "admin.html";
            }
        });
    }

    // 3. Mobile Navigation Drawer
    const menuToggle = document.getElementById("mobile-menu");
    const navbar = document.getElementById("navbar");
    if (menuToggle && navbar) {
        menuToggle.addEventListener("click", () => {
            navbar.classList.toggle("active");
        });
    }

    // 4. Initial Load
    loadHomepageHighlights();
    preloadServicesData();

    // 5. Direct Hash URL Routing Support
    handleInitialUrlRoute();
});

// XSS Sanitizer Helper
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
    }[tag] || tag));
}

// Preload service data for instant write-up rendering
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
                    <img src="${escapeHTML(photo.image_url)}" alt="Celebration Highlight" loading="lazy">
                </div>
            `).join("");
        } else {
            // Elegant fallback highlights
            grid.innerHTML = `
                <div class="gallery-item"><img src="https://images.unsplash.com/photo-1519225468359-2996bc010854?w=600&q=80" alt="Highlight"></div>
                <div class="gallery-item"><img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80" alt="Highlight"></div>
                <div class="gallery-item"><img src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80" alt="Highlight"></div>
                <div class="gallery-item"><img src="https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&q=80" alt="Highlight"></div>
            `;
        }
    } catch (err) {
        grid.innerHTML = "";
    }
}

// =========================================================
// 2-LEVEL DRILL DOWN NAVIGATION
// =========================================================

// LEVEL 1: Open Celebration Overview (e.g., Wedding)
async function openEvent(eventId, skipHistory = false) {
    if (!skipHistory) {
        lastScrollPosition = window.scrollY;
    }

    currentActiveEventId = eventId;
    currentActiveServiceId = null;

    const homeView = document.getElementById("home-view");
    const serviceView = document.getElementById("service-view");
    const eventLevelView = document.getElementById("event-level-view");
    const subserviceLevelView = document.getElementById("subservice-level-view");
    const navbar = document.getElementById("navbar");

    if (navbar) navbar.classList.remove("active");

    // Switch View Containers
    homeView.classList.add("hidden");
    serviceView.classList.remove("hidden");
    eventLevelView.classList.remove("hidden");
    subserviceLevelView.classList.add("hidden");
    window.scrollTo(0, 0);

    const eventInfo = EVENT_MAP[eventId] || { title: "Celebration", formVal: "Other" };

    // 1. Breadcrumbs
    renderBreadcrumbs([
        { label: "Home", action: "navigateToHome()" },
        { label: eventInfo.title, active: true }
    ]);

    // 2. Heading & Matter
    const titleEl = document.getElementById("dynamic-event-title");
    const descEl = document.getElementById("dynamic-event-description");
    titleEl.textContent = eventInfo.title;

    const cached = servicesDataCache[eventId];
    if (cached && cached.description) {
        descEl.textContent = cached.description;
    } else {
        descEl.textContent = `At Pearl Crown Events, our ${eventInfo.title} celebrations are curated with royal elegance, precision, and heartfelt emotion.`;
    }

    // 3. Render Clickable Services List for this Event
    renderEventServicesList(eventId, eventInfo.title);

    // 4. Fetch Event General Photos (ZERO placeholder placard if empty)
    await loadGalleryGrid("dynamic-event-gallery", eventId);

    // 5. Update Browser History
    if (!skipHistory) {
        history.pushState({ view: "event", eventId: eventId }, "", `#${eventId}`);
    }
}

// LEVEL 2: Open Specific Service under Event (e.g., Wedding -> Design & Decor)
async function openEventService(eventId, serviceKey, skipHistory = false) {
    currentActiveEventId = eventId;
    currentActiveServiceId = serviceKey;

    const eventLevelView = document.getElementById("event-level-view");
    const subserviceLevelView = document.getElementById("subservice-level-view");

    eventLevelView.classList.add("hidden");
    subserviceLevelView.classList.remove("hidden");
    window.scrollTo(0, 0);

    const eventInfo = EVENT_MAP[eventId] || { title: "Celebration" };
    const serviceMeta = ALL_SERVICES.find(s => s.id === serviceKey) || { title: "Service", defaultDesc: "" };

    const compositeTitle = `${eventInfo.title} ${serviceMeta.title}`;

    // 1. Breadcrumbs
    renderBreadcrumbs([
        { label: "Home", action: "navigateToHome()" },
        { label: eventInfo.title, action: `openEvent('${eventId}', true)` },
        { label: serviceMeta.title, active: true }
    ]);

    // 2. Heading & Matter
    const titleEl = document.getElementById("dynamic-subservice-title");
    const descEl = document.getElementById("dynamic-subservice-description");
    titleEl.textContent = compositeTitle;

    // Check if custom write-up exists for this event-service combo or fallback to intelligent template
    const compositeKey = `${eventId}__${serviceKey}`;
    const cached = servicesDataCache[compositeKey] || servicesDataCache[serviceKey];

    if (cached && cached.description) {
        descEl.textContent = cached.description;
    } else {
        descEl.textContent = `Elevating your ${eventInfo.title} with bespoke ${serviceMeta.title.toLowerCase()}. ${serviceMeta.defaultDesc}`;
    }

    // 3. Fetch Event-Service Photos (ZERO placeholder placard if empty)
    await loadGalleryGrid("dynamic-subservice-gallery", compositeKey);

    // 4. Update Browser History
    if (!skipHistory) {
        history.pushState({ view: "subservice", eventId: eventId, serviceKey: serviceKey }, "", `#${eventId}__${serviceKey}`);
    }
}

// Render the 7 Clickable Services inside an Event Page
function renderEventServicesList(eventId, eventTitle) {
    const listEl = document.getElementById("event-services-list");
    const headingEl = document.getElementById("event-services-heading");
    
    if (headingEl) {
        headingEl.textContent = `${eventTitle} Services`;
    }

    if (!listEl) return;

    listEl.innerHTML = ALL_SERVICES.map(svc => `
        <li onclick="openEventService('${escapeHTML(eventId)}', '${escapeHTML(svc.id)}')">
            <i class="fas fa-arrow-right"></i>
            <span>${escapeHTML(eventTitle)} ${escapeHTML(svc.title)}</span>
            <span class="explore-badge">Explore <i class="fas fa-chevron-right"></i></span>
        </li>
    `).join("");
}

// Generic Photo Loader with NO PLACEHOLDER PLACARD
async function loadGalleryGrid(targetElementId, categoryKey) {
    const grid = document.getElementById(targetElementId);
    if (!grid) return;

    // Reset container completely
    grid.innerHTML = "";

    try {
        const res = await fetch(`/api/gallery?service_id=${encodeURIComponent(categoryKey)}`);
        if (!res.ok) return;
        const photos = await res.json();

        // If photos exist, show them; otherwise leave grid empty/hidden
        if (photos && photos.length > 0) {
            grid.innerHTML = photos.map(photo => `
                <div class="gallery-item">
                    <img src="${escapeHTML(photo.image_url)}" alt="Celebration photo" loading="lazy">
                </div>
            `).join("");
        }
    } catch (e) {
        console.error("Gallery loading failed:", e);
        grid.innerHTML = "";
    }
}

// Breadcrumb HTML Builder
function renderBreadcrumbs(crumbs) {
    const bar = document.getElementById("breadcrumb-bar");
    if (!bar) return;

    bar.innerHTML = crumbs.map((crumb, idx) => {
        const separator = idx > 0 ? `<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>` : ``;
        if (crumb.active) {
            return `${separator}<span class="breadcrumb-current">${escapeHTML(crumb.label)}</span>`;
        }
        return `${separator}<a onclick="${crumb.action}">${escapeHTML(crumb.label)}</a>`;
    }).join("");
}

// Return to Homepage
function navigateToHome(scrollToId = null) {
    const homeView = document.getElementById("home-view");
    const serviceView = document.getElementById("service-view");
    const navbar = document.getElementById("navbar");

    if (navbar) navbar.classList.remove("active");

    serviceView.classList.add("hidden");
    homeView.classList.remove("hidden");

    currentActiveEventId = null;
    currentActiveServiceId = null;

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

    if (history.state) {
        history.pushState({ view: "home" }, "", " ");
    }
}

// "Enquire Now" with Smart Pre-filling
function enquireCurrentContext() {
    const eventInfo = currentActiveEventId ? EVENT_MAP[currentActiveEventId] : null;
    const serviceInfo = currentActiveServiceId ? ALL_SERVICES.find(s => s.id === currentActiveServiceId) : null;

    navigateToHome("contact");

    // Pre-populate form fields
    setTimeout(() => {
        const eventSelect = document.getElementById("form-event-type");
        const messageBox = document.getElementById("form-message");

        if (eventSelect && eventInfo) {
            eventSelect.value = eventInfo.formVal;
        }

        if (messageBox) {
            if (eventInfo && serviceInfo) {
                messageBox.value = `Hello Pearl Crown Events, I am planning a ${eventInfo.title} and would like more details regarding ${serviceInfo.title} (Date, Venue, guest count): `;
            } else if (eventInfo) {
                messageBox.value = `Hello Pearl Crown Events, I am interested in planning a ${eventInfo.title} (Date, Venue, guest count): `;
            }
            messageBox.focus();
        }
    }, 150);
}

// Browser Physical Back / Forward Button Handling
window.onpopstate = function(event) {
    if (!event.state || event.state.view === "home") {
        navigateToHome();
    } else if (event.state.view === "event") {
        openEvent(event.state.eventId, true);
    } else if (event.state.view === "subservice") {
        openEventService(event.state.eventId, event.state.serviceKey, true);
    }
};

// URL Hash routing on page load (e.g., direct links like #wedding or #wedding__design)
function handleInitialUrlRoute() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    if (hash.includes("__")) {
        const [evt, svc] = hash.split("__");
        if (EVENT_MAP[evt]) {
            openEventService(evt, svc, true);
        }
    } else if (EVENT_MAP[hash]) {
        openEvent(hash, true);
    }
}

// =========================================================
// CONTACT FORM SUBMISSION
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

    const formData = new FormData(form);
    const inquiryPayload = {
        user_name: formData.get("user_name"),
        phone_number: formData.get("phone_number"),
        event_type: formData.get("event_type"),
        message: formData.get("message")
    };

    try {
        const res = await fetch("/api/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inquiryPayload)
        });

        if (!res.ok) throw new Error("Database submission failed");

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