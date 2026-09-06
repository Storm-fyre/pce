-- 1. Services & Events Table
DROP TABLE IF EXISTS services;
CREATE TABLE services (
    id TEXT PRIMARY KEY,               -- e.g., 'wedding', 'venue', 'cradle'
    title TEXT NOT NULL,              -- Display Name (e.g., 'Cradle Ceremonies')
    type TEXT NOT NULL,               -- 'event' or 'service'
    description TEXT,                 -- Detailed write-up
    display_order INTEGER DEFAULT 0   -- Display sequence
);

-- 2. Gallery Photos Table
DROP TABLE IF EXISTS gallery_photos;
CREATE TABLE gallery_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL,         -- Links to services.id or 'highlights'
    image_url TEXT NOT NULL,          -- Cloudflare R2 public URL
    caption TEXT,
    is_highlight INTEGER DEFAULT 0,   -- 1 = Shows on Homepage "Our Highlights"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 3. Customer Inquiries / Leads Table
DROP TABLE IF EXISTS inquiries;
CREATE TABLE inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'New',         -- 'New', 'Contacted', 'Booked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Site Settings Table
DROP TABLE IF EXISTS site_settings;
CREATE TABLE site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- =========================================================
-- PRE-SEEDING INITIAL CEREMONIES & SERVICES
-- =========================================================

-- Events
INSERT INTO services (id, title, type, description, display_order) VALUES
('wedding', 'Wedding', 'event', 
 'At Pearl Crown Events, we believe a wedding is not just an event—it is a beautiful story of love, emotions, and togetherness. We feel truly honored to have curated this special day for the Bride and Groom.', 1),

('engagement', 'Engagement', 'event', 
 'Celebrating the beginning of your forever. From traditional ring ceremonies to chic contemporary themes, we create magical settings for your special announcement.', 2),

('anniversary', 'Anniversary Parties', 'event', 
 'Reliving the beautiful journey of love. Whether an intimate silver milestone or a grand golden jubilee, we make every moment memorable.', 3),

('birthday', 'Birthday Parties', 'event', 
 'Fun, excitement, and memories for all ages. Colorful thematic setups, entertainment, and seamless planning for children and adults alike.', 4),

('cradle', 'Cradle Ceremonies', 'event', 
 'Welcoming the newest member of your family with joy and warmth. Traditional cradle designs combined with graceful contemporary florals.', 5),

('bommala', 'Bommala Koluvu', 'event', 
 'Traditional setups with modern elegance. Authentic festive decor celebrating heritage, craftsmanship, and family warmth.', 6),

('sangeet', 'Sangeet', 'event', 
 'Music, dance, and vibrant celebrations! State-of-the-art stage setups, lighting, acoustics, and dance-floor coordination to get everyone celebrating.', 7),

('mehandi', 'Mehandi Function', 'event', 
 'Colorful patterns and festive vibes. Cozy seating setups, photobooths, and vibrant color-burst themes tailored for your friends and family.', 8),

('halfsaree', 'Half-Saree Function', 'event', 
 'A traditional celebration of grace and transition. Elegant temple-style backdrops, rich floral craftsmanship, and traditional grandeur.', 9);

-- Services
INSERT INTO services (id, title, type, description, display_order) VALUES
('venue', 'Venue Management', 'service', 
 'At Pearl Crown Events, venue management is the foundation of a successful event. From selecting the perfect location to coordinating every logistical detail, we ensure the venue complements the vision and purpose of your celebration. Our team carefully manages layout planning, vendor coordination, guest flow, décor alignment, power backup, safety measures, and on-ground supervision.', 10),

('planning', 'Planning & Concept', 'service', 
 'Blueprinting your perfect event from inception to reality. We conceptualize cohesive themes, budget allocations, schedules, and complete execution blueprints.', 11),

('design', 'Design & Decor', 'service', 
 'We create breathtaking environments that reflect your personal style. Bespoke floral arrangements, scenic lighting, mandap designs, and entrance architecture.', 12),

('catering', 'Catering Services', 'service', 
 'Delicious flavors to delight your guests. Curating gourmet multi-cuisine menus, live stations, and impeccable banquet service presentation.', 13),

('media', 'Media Management', 'service', 
 'Capturing moments that last forever. Directing premium candid photography, cinematic wedding films, drone coverage, and prompt album deliveries.', 14);

-- Pre-seed default settings
INSERT INTO site_settings (key, value) VALUES 
('contact_phone', '+91 73868 79771'),
('contact_email', 'pearlcrownevents5@gmail.com'),
('locations', 'Rajahmundry & Hyderabad');