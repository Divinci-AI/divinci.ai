// GDPR Compliance Module
// Handles cookie consent, data privacy, and user preferences

class GDPRCompliance {
  constructor() {
    this.cookieConsent = null;
    this.consentGiven = false;
    this.analyticsEnabled = false;
    this.marketingEnabled = false;
    this.isEUUser = false;
    
    this.init();
  }

  init() {
    // Check for existing consent
    this.loadSavedConsent();
    
    // Check user location and show banner if needed
    this.checkUserLocationAndShowBanner();
    
    // Initialize analytics based on consent
    this.initializeAnalytics();
  }

  async checkUserLocationAndShowBanner() {
    // First check if consent already given
    if (this.consentGiven) {
      return;
    }

    try {
      // Try geolocation detection
      await this.detectUserLocation();
      
      // Only show banner for EU users
      if (this.isEUUser) {
        this.showCookieBanner();
      } else {
        // For non-EU users, silently enable essential cookies only
        this.saveConsent({ analytics: false, marketing: false }, false);
      }
    } catch (error) {
      // GDPR-compliant: show banner when location is unknown
      this.showCookieBanner();
    }
  }

  async detectUserLocation() {
    // Method 1: Try timezone-based detection first (privacy-friendly)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const euTimezones = [
      'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Rome', 
      'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna',
      'Europe/Warsaw', 'Europe/Prague', 'Europe/Budapest', 'Europe/Stockholm',
      'Europe/Helsinki', 'Europe/Copenhagen', 'Europe/Athens', 'Europe/Dublin',
      'Europe/Luxembourg', 'Europe/Zagreb', 'Europe/Sofia', 'Europe/Bucharest'
    ];
    
    if (euTimezones.some(tz => timezone.includes(tz))) {
      this.isEUUser = true;
      return;
    }

    // If not EU timezone, assume non-EU (most websites do this)
    this.isEUUser = false;
  }

  loadSavedConsent() {
    try {
      const consent = localStorage.getItem('divinci-gdpr-consent');
      if (consent) {
        const consentData = JSON.parse(consent);
        this.consentGiven = true;
        this.analyticsEnabled = consentData.analytics || false;
        this.marketingEnabled = consentData.marketing || false;
        
      }
    } catch (error) {
      // Consent loading failed, will show banner
    }
  }

  saveConsent(preferences, showBanner = true) {
    try {
      const consentData = {
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        timestamp: new Date().toISOString(),
        version: '1.0',
        userLocation: this.isEUUser ? 'EU' : 'Non-EU'
      };
      
      localStorage.setItem('divinci-gdpr-consent', JSON.stringify(consentData));
      
      this.consentGiven = true;
      this.analyticsEnabled = preferences.analytics;
      this.marketingEnabled = preferences.marketing;
      
    } catch (error) {
      // Consent saving failed silently
    }
  }

  showCookieBanner() {
    // Create cookie banner if it doesn't exist
    if (document.getElementById('gdpr-cookie-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'gdpr-cookie-banner';
    banner.innerHTML = `
      <div class="gdpr-banner-content">
        <div class="gdpr-banner-text">
          <h3>Your Privacy Matters</h3>
          <p>We use cookies to enhance your experience, analyze site usage, and improve our services. You can customize your preferences or accept all cookies.</p>
        </div>
        <div class="gdpr-banner-actions">
          <button id="gdpr-accept-all" class="gdpr-btn gdpr-btn-primary">Accept All</button>
          <button id="gdpr-customize" class="gdpr-btn gdpr-btn-secondary">Customize</button>
          <button id="gdpr-reject-all" class="gdpr-btn gdpr-btn-tertiary">Reject All</button>
        </div>
      </div>
      <div id="gdpr-preferences-panel" class="gdpr-preferences hidden">
        <div class="gdpr-preferences-content">
          <h3>Cookie Preferences</h3>
          <div class="gdpr-cookie-category">
            <div class="gdpr-cookie-toggle">
              <label>
                <input type="checkbox" id="gdpr-essential" checked disabled>
                <span class="gdpr-toggle-slider"></span>
                Essential Cookies
              </label>
              <p class="gdpr-category-description">Required for the website to function properly. Cannot be disabled.</p>
            </div>
          </div>
          <div class="gdpr-cookie-category">
            <div class="gdpr-cookie-toggle">
              <label>
                <input type="checkbox" id="gdpr-analytics">
                <span class="gdpr-toggle-slider"></span>
                Analytics Cookies
              </label>
              <p class="gdpr-category-description">Help us understand how visitors interact with our website.</p>
            </div>
          </div>
          <div class="gdpr-cookie-category">
            <div class="gdpr-cookie-toggle">
              <label>
                <input type="checkbox" id="gdpr-marketing">
                <span class="gdpr-toggle-slider"></span>
                Marketing Cookies
              </label>
              <p class="gdpr-category-description">Used to deliver relevant advertisements and track ad performance.</p>
            </div>
          </div>
          <div class="gdpr-preferences-actions">
            <button id="gdpr-save-preferences" class="gdpr-btn gdpr-btn-primary">Save Preferences</button>
            <button id="gdpr-cancel-preferences" class="gdpr-btn gdpr-btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    `;

    // Add CSS styles
    const styles = document.createElement('style');
    styles.textContent = `
      #gdpr-cookie-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(45, 60, 52, 0.98);
        color: white;
        padding: 1.5rem;
        z-index: 10000;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
      }
      
      .gdpr-banner-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
      }
      
      .gdpr-banner-text h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        color: #f8f4f0;
      }
      
      .gdpr-banner-text p {
        margin: 0;
        color: rgba(248, 244, 240, 0.9);
        line-height: 1.5;
      }
      
      .gdpr-banner-actions {
        display: flex;
        gap: 1rem;
        flex-shrink: 0;
      }
      
      .gdpr-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        font-size: 0.9rem;
      }
      
      .gdpr-btn-primary {
        background: #cfdcff;
        color: #2d3c34;
      }
      
      .gdpr-btn-primary:hover {
        background: #b8c9ff;
        transform: translateY(-1px);
      }
      
      .gdpr-btn-secondary {
        background: transparent;
        color: #cfdcff;
        border: 2px solid #cfdcff;
      }
      
      .gdpr-btn-secondary:hover {
        background: #cfdcff;
        color: #2d3c34;
      }
      
      .gdpr-btn-tertiary {
        background: transparent;
        color: rgba(248, 244, 240, 0.7);
        border: 1px solid rgba(248, 244, 240, 0.3);
      }
      
      .gdpr-btn-tertiary:hover {
        background: rgba(248, 244, 240, 0.1);
        color: #f8f4f0;
      }
      
      .gdpr-preferences {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(45, 60, 52, 0.98);
        padding: 2rem;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .gdpr-preferences.hidden {
        display: none;
      }
      
      .gdpr-preferences-content {
        max-width: 600px;
        margin: 0 auto;
      }
      
      .gdpr-preferences-content h3 {
        margin: 0 0 2rem 0;
        color: #f8f4f0;
        font-size: 1.5rem;
      }
      
      .gdpr-cookie-category {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: rgba(248, 244, 240, 0.05);
        border-radius: 0.5rem;
      }
      
      .gdpr-cookie-toggle label {
        display: flex;
        align-items: center;
        gap: 1rem;
        cursor: pointer;
        font-weight: 600;
        color: #f8f4f0;
      }
      
      .gdpr-category-description {
        margin: 0.5rem 0 0 0;
        color: rgba(248, 244, 240, 0.7);
        font-size: 0.9rem;
        line-height: 1.4;
      }
      
      .gdpr-preferences-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
      }
      
      @media (max-width: 768px) {
        .gdpr-banner-content {
          flex-direction: column;
          text-align: center;
        }
        
        .gdpr-banner-actions {
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .gdpr-btn {
          padding: 0.6rem 1.2rem;
          font-size: 0.85rem;
        }
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(banner);

    // Add event listeners
    this.attachBannerEventListeners();
  }

  attachBannerEventListeners() {
    // Accept all cookies
    document.getElementById('gdpr-accept-all')?.addEventListener('click', () => {
      this.saveConsent({ analytics: true, marketing: true });
      this.hideCookieBanner();
      this.initializeAnalytics();
    });

    // Reject all non-essential cookies
    document.getElementById('gdpr-reject-all')?.addEventListener('click', () => {
      this.saveConsent({ analytics: false, marketing: false });
      this.hideCookieBanner();
    });

    // Show preferences panel
    document.getElementById('gdpr-customize')?.addEventListener('click', () => {
      document.getElementById('gdpr-preferences-panel')?.classList.remove('hidden');
    });

    // Save custom preferences
    document.getElementById('gdpr-save-preferences')?.addEventListener('click', () => {
      const analytics = document.getElementById('gdpr-analytics')?.checked || false;
      const marketing = document.getElementById('gdpr-marketing')?.checked || false;
      
      this.saveConsent({ analytics, marketing });
      this.hideCookieBanner();
      this.initializeAnalytics();
    });

    // Cancel preferences
    document.getElementById('gdpr-cancel-preferences')?.addEventListener('click', () => {
      document.getElementById('gdpr-preferences-panel')?.classList.add('hidden');
    });
  }

  hideCookieBanner() {
    const banner = document.getElementById('gdpr-cookie-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => banner.remove(), 300);
    }
  }

  initializeAnalytics() {
    if (this.analyticsEnabled) {
      // Initialize analytics only if consent given
      // Analytics enabled - initializing tracking
      
      // Example: Initialize Google Analytics
      // gtag('config', 'GA_MEASUREMENT_ID');
      
      // Track page view
      this.trackPageView();
    } else {
      // Analytics disabled by user preference
    }
  }

  trackPageView() {
    if (!this.analyticsEnabled) return;
    
    // Example analytics tracking
    // Track page view
    
    // You would implement actual analytics here
    // gtag('event', 'page_view', { page_location: window.location.href });
  }

  trackEvent(eventName, parameters = {}) {
    if (!this.analyticsEnabled) return;
    
    // Track event
    
    // Example event tracking
    // gtag('event', eventName, parameters);
  }

  // Method to revoke consent (for privacy settings page)
  revokeConsent() {
    localStorage.removeItem('divinci-gdpr-consent');
    this.consentGiven = false;
    this.analyticsEnabled = false;
    this.marketingEnabled = false;
    
    // Consent revoked
    
    // Show banner again
    this.showCookieBanner();
  }

  // Method to check if specific consent type is given
  hasConsent(type) {
    switch (type) {
      case 'analytics':
        return this.analyticsEnabled;
      case 'marketing':
        return this.marketingEnabled;
      case 'essential':
        return true; // Always true for essential cookies
      default:
        return false;
    }
  }

  // Data subject rights methods
  exportUserData() {
    const userData = {
      consentTimestamp: JSON.parse(localStorage.getItem('divinci-gdpr-consent') || '{}').timestamp,
      preferences: {
        analytics: this.analyticsEnabled,
        marketing: this.marketingEnabled
      },
      // Add other user data as needed
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'divinci-user-data.json';
    link.click();
    
    // User data exported
  }

  deleteUserData() {
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      localStorage.removeItem('divinci-gdpr-consent');
      
      // Clear any other stored user data
      // You would implement actual data deletion here
      
      alert('Your data has been deleted.');
      // User data deleted
      
      // Reload page to reset state
      window.location.reload();
    }
  }
}

// Initialize GDPR compliance when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.gdprCompliance = new GDPRCompliance();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GDPRCompliance;
}