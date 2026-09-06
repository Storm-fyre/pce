// admin.js

let token = localStorage.getItem("pceAdminToken");
let allServices = [];
let uploadFileQueue = [];

// --- XSS Sanitization Helper ---
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
    }[tag] || tag));
}

const authHeaders = () => ({
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
});

// --- Lifecycle Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    if (token) {
        showDashboard();
    } else {
        document.getElementById("login-screen").style.display = "block";
    }
});

// --- Authentication Handlers ---
async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById("admin-password").value;
    const btn = document.getElementById("login-btn");
    const errorEl = document.getElementById("login-error");

    btn.disabled = true;
    btn.innerText = "Authenticating...";
    errorEl.style.display = "none";

    try {
        const res = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            const data = await res.json();
            token = data.token;
            localStorage.setItem("pceAdminToken", token);
            showDashboard();
        } else {
            errorEl.style.display = "block";
        }
    } catch (err) {
        alert("Server error connecting to login endpoint.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Log In";
    }
}

function logoutAdmin() {
    localStorage.removeItem("pceAdminToken");
    location.reload();
}

function showDashboard() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-header").style.display = "flex";
    document.getElementById("dashboard-screen").style.display = "block";
    loadInitialData();
}

// --- Tab Switching ---
function switchTab(tabId, event) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`tab-${tabId}`).classList.add("active");
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }

    if (tabId === "highlights") loadHighlights();
    if (tabId === "inquiries") loadInquiries();
}

// --- Data Loading ---
async function loadInitialData() {
    await loadCategories();
    onCategoryChange();
}

async function loadCategories() {
    try {
        const res = await fetch("/api/services");
        allServices = await res.json();
        
        const selector = document.getElementById("category-selector");
        selector.innerHTML = allServices.map(s => `
            <option value="${escapeHTML(s.id)}">${escapeHTML(s.title)} (${s.type === 'event' ? 'Event' : 'Service'})</option>
        `).join("");
    } catch (err) {
        console.error("Failed loading categories:", err);
    }
}

function onCategoryChange() {
    const selectedId = document.getElementById("category-selector").value;
    const currentService = allServices.find(s => s.id === selectedId);
    
    if (currentService) {
        document.getElementById("category-description").value = currentService.description || "";
    }
    loadCategoryGallery(selectedId);
}

// --- Update Description ---
async function saveCategoryDescription() {
    const selectedId = document.getElementById("category-selector").value;
    const description = document.getElementById("category-description").value;

    try {
        const res = await fetch("/api/services", {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ id: selectedId, description })
        });

        if (res.ok) {
            alert("Description saved successfully!");
            // Update local state
            const target = allServices.find(s => s.id === selectedId);
            if (target) target.description = description;
        } else {
            alert("Failed to save description.");
        }
    } catch (e) {
        alert("Error updating description.");
    }
}

// --- Photo Upload & Compressor.js Handling ---
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    files.forEach(file => {
        new Compressor(file, {
            quality: 0.75,
            maxWidth: 1920,
            maxHeight: 1920,
            mimeType: "image/jpeg",
            success(result) {
                const compressedFile = new File([result], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: "image/jpeg"
                });
                
                // Read preview thumbnail
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadFileQueue.push({ file: compressedFile, previewUrl: e.target.result });
                    renderPhotoQueue();
                };
                reader.readAsDataURL(compressedFile);
            },
            error(err) {
                console.error("Compression error:", err);
            }
        });
    });

    event.target.value = "";
}

function renderPhotoQueue() {
    const container = document.getElementById("photo-queue-container");
    const actions = document.getElementById("upload-actions");

    if (uploadFileQueue.length === 0) {
        container.innerHTML = "";
        actions.style.display = "none";
        return;
    }

    actions.style.display = "block";
    container.innerHTML = uploadFileQueue.map((item, idx) => `
        <div class="queue-item">
            <img src="${item.previewUrl}" alt="Preview">
            <button type="button" class="queue-remove-btn" onclick="removeQueueItem(${idx})">&times;</button>
        </div>
    `).join("");
}

function removeQueueItem(idx) {
    uploadFileQueue.splice(idx, 1);
    renderPhotoQueue();
}

async function uploadQueue() {
    const selectedId = document.getElementById("category-selector").value;
    if (!uploadFileQueue.length) return;

    const btn = document.getElementById("btn-upload-queue");
    const progress = document.getElementById("upload-progress-text");

    btn.disabled = true;
    progress.style.display = "block";

    for (let i = 0; i < uploadFileQueue.length; i++) {
        progress.innerText = `Uploading photo ${i + 1} of ${uploadFileQueue.length}...`;
        const formData = new FormData();
        formData.append("image", uploadFileQueue[i].file);

        try {
            // 1. Upload to Cloudflare R2
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();

            // 2. Save record into D1
            if (uploadData.url) {
                await fetch("/api/gallery", {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        service_id: selectedId,
                        image_url: uploadData.url,
                        is_highlight: 0
                    })
                });
            }
        } catch (err) {
            console.error("Upload error at index " + i, err);
        }
    }

    uploadFileQueue = [];
    renderPhotoQueue();
    btn.disabled = false;
    progress.style.display = "none";
    loadCategoryGallery(selectedId);
}

// --- Category Gallery Display & Actions ---
async function loadCategoryGallery(serviceId) {
    const grid = document.getElementById("category-gallery-grid");
    grid.innerHTML = "<p style='color: var(--text-muted);'>Loading photos...</p>";

    try {
        const res = await fetch(`/api/gallery?service_id=${serviceId}`);
        const photos = await res.json();

        if (!photos.length) {
            grid.innerHTML = "<p style='color: var(--text-muted);'>No photos uploaded for this ceremony yet.</p>";
            return;
        }

        grid.innerHTML = photos.map(photo => `
            <div class="gallery-card">
                <img src="${escapeHTML(photo.image_url)}" alt="Photo">
                <div class="gallery-card-body">
                    <span class="badge-highlight ${photo.is_highlight ? 'active' : 'inactive'}" 
                          onclick="toggleHighlight(${photo.id}, ${photo.is_highlight ? 0 : 1}, '${serviceId}')">
                          <i class="fas fa-star"></i> ${photo.is_highlight ? 'Highlighted' : 'Highlight'}
                    </span>
                    <button class="btn-icon-danger" onclick="deletePhoto(${photo.id}, '${serviceId}')" title="Delete Photo">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join("");
    } catch (e) {
        grid.innerHTML = "<p style='color: var(--danger);'>Failed to load photos.</p>";
    }
}

async function toggleHighlight(photoId, newStatus, currentServiceId) {
    try {
        await fetch("/api/gallery", {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ id: photoId, is_highlight: newStatus })
        });
        if (currentServiceId) loadCategoryGallery(currentServiceId);
    } catch (e) {
        alert("Failed to toggle highlight status.");
    }
}

async function deletePhoto(photoId, currentServiceId) {
    if (!confirm("Are you sure you want to permanently delete this photo?")) return;

    try {
        const res = await fetch(`/api/gallery?id=${photoId}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (res.ok) {
            if (currentServiceId) loadCategoryGallery(currentServiceId);
        } else {
            alert("Error deleting photo.");
        }
    } catch (e) {
        alert("Network error deleting photo.");
    }
}

// --- Homepage Highlights Tab ---
async function loadHighlights() {
    const grid = document.getElementById("highlights-gallery-grid");
    grid.innerHTML = "<p style='color: var(--text-muted);'>Loading highlights...</p>";

    try {
        const res = await fetch("/api/gallery?highlights=1");
        const photos = await res.json();

        if (!photos.length) {
            grid.innerHTML = "<p style='color: var(--text-muted);'>No photos marked as highlights yet.</p>";
            return;
        }

        grid.innerHTML = photos.map(photo => `
            <div class="gallery-card">
                <img src="${escapeHTML(photo.image_url)}" alt="Highlight Photo">
                <div class="gallery-card-body">
                    <span class="badge-highlight active" onclick="toggleHighlight(${photo.id}, 0); loadHighlights();">
                        <i class="fas fa-check"></i> Featured
                    </span>
                    <button class="btn-icon-danger" onclick="deletePhoto(${photo.id}); loadHighlights();">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join("");
    } catch (e) {
        grid.innerHTML = "<p style='color: var(--danger);'>Failed loading highlights.</p>";
    }
}

// --- Client Inquiries Tab ---
async function loadInquiries() {
    const tbody = document.getElementById("inquiries-tbody");
    tbody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>Loading inquiries...</td></tr>";

    try {
        const res = await fetch("/api/inquiries", { headers: authHeaders() });
        const inquiries = await res.json();

        if (!inquiries.length) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align: center; color: var(--text-muted);'>No inquiries received yet.</td></tr>";
            return;
        }

        tbody.innerHTML = inquiries.map(inq => {
            const formattedDate = new Date(inq.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
            });
            return `
                <tr>
                    <td style="white-space: nowrap; font-size: 0.9rem;">${formattedDate}</td>
                    <td><strong>${escapeHTML(inq.user_name)}</strong></td>
                    <td><a href="tel:${escapeHTML(inq.phone_number)}" style="color: var(--primary-blue); font-weight: bold;"><i class="fas fa-phone-alt"></i> ${escapeHTML(inq.phone_number)}</a></td>
                    <td><span style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem;">${escapeHTML(inq.event_type)}</span></td>
                    <td style="max-width: 300px; font-size: 0.9rem;">${escapeHTML(inq.message)}</td>
                    <td>
                        <button class="btn-icon-danger" onclick="deleteInquiry(${inq.id})" title="Delete Record">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (e) {
        tbody.innerHTML = "<tr><td colspan='6' style='color: var(--danger); text-align: center;'>Failed to load inquiries.</td></tr>";
    }
}

async function deleteInquiry(id) {
    if (!confirm("Delete this inquiry record?")) return;
    try {
        await fetch(`/api/inquiries?id=${id}`, { method: "DELETE", headers: authHeaders() });
        loadInquiries();
    } catch (e) {
        alert("Failed deleting inquiry.");
    }
}