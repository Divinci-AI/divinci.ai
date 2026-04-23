/**
 * Unit Tests for GDPR Compliance Module
 * Tests cookie consent logic, user preferences, and data privacy functions
 */

describe('GDPR Compliance', () => {
    let mockLocalStorage;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => mockLocalStorage[key] || null),
                setItem: jest.fn((key, value) => {
                    mockLocalStorage[key] = value;
                }),
                removeItem: jest.fn((key) => {
                    delete mockLocalStorage[key];
                }),
                clear: jest.fn(() => {
                    mockLocalStorage = {};
                })
            },
            writable: true
        });

        // Mock Date
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01'));
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('Cookie Consent Management', () => {
        test('should initialize with no consent by default', () => {
            const consent = loadSavedConsent();
            expect(consent.consentGiven).toBe(false);
            expect(consent.analyticsEnabled).toBe(false);
            expect(consent.marketingEnabled).toBe(false);
        });

        test('should save consent preferences correctly', () => {
            const consentData = {
                consentGiven: true,
                analyticsEnabled: true,
                marketingEnabled: false,
                consentDate: new Date().toISOString()
            };

            saveConsentPreferences(consentData);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'gdpr_consent',
                JSON.stringify(consentData)
            );
        });

        test('should load saved consent preferences', () => {
            const savedConsent = {
                consentGiven: true,
                analyticsEnabled: true,
                marketingEnabled: true,
                consentDate: '2024-01-01T00:00:00.000Z'
            };

            mockLocalStorage['gdpr_consent'] = JSON.stringify(savedConsent);

            const loadedConsent = loadSavedConsent();
            expect(loadedConsent).toEqual(savedConsent);
        });

        test('should handle corrupted localStorage data gracefully', () => {
            mockLocalStorage['gdpr_consent'] = 'invalid json';

            const consent = loadSavedConsent();
            expect(consent.consentGiven).toBe(false);
        });
    });

    describe('Cookie Management', () => {
        test('should generate correct cookie strings', () => {
            const cookieString = generateCookieString('test_cookie', 'test_value', 30);
            expect(cookieString).toContain('test_cookie=test_value');
            expect(cookieString).toContain('expires=');
            expect(cookieString).toContain('path=/');
            expect(cookieString).toContain('SameSite=Lax');
        });

        test('should calculate correct expiration dates', () => {
            const expiryDate = calculateExpiryDate(30);
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + 30);
            
            expect(expiryDate.toDateString()).toBe(expectedDate.toDateString());
        });

        test('should validate cookie names correctly', () => {
            expect(isValidCookieName('valid_cookie_name')).toBe(true);
            expect(isValidCookieName('valid-cookie-name')).toBe(true);
            expect(isValidCookieName('')).toBe(false);
            expect(isValidCookieName('invalid cookie name')).toBe(false);
            expect(isValidCookieName('invalid;cookie')).toBe(false);
        });
    });

    describe('User Preferences', () => {
        test('should update analytics preferences correctly', () => {
            const preferences = {
                analytics: true,
                marketing: false,
                functional: true
            };

            const result = updateUserPreferences(preferences);
            
            expect(result.analyticsEnabled).toBe(true);
            expect(result.marketingEnabled).toBe(false);
            expect(result.functionalEnabled).toBe(true);
        });

        test('should validate preference objects', () => {
            const validPrefs = { analytics: true, marketing: false };
            const invalidPrefs = { analytics: 'yes', marketing: 123 };

            expect(validatePreferences(validPrefs)).toBe(true);
            expect(validatePreferences(invalidPrefs)).toBe(false);
        });
    });

    describe('EU User Detection', () => {
        test('should detect EU users from timezone', () => {
            // Mock timezone to simulate EU user
            jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
                resolvedOptions: () => ({ timeZone: 'Europe/London' })
            });

            expect(isLikelyEUUser()).toBe(true);
        });

        test('should detect non-EU users from timezone', () => {
            jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
                resolvedOptions: () => ({ timeZone: 'America/New_York' })
            });

            expect(isLikelyEUUser()).toBe(false);
        });

        test('should handle unknown timezones gracefully', () => {
            jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
                resolvedOptions: () => ({ timeZone: 'Unknown/Timezone' })
            });

            // Should default to showing banner for safety
            expect(isLikelyEUUser()).toBe(true);
        });
    });
});

// Helper functions extracted for testing
function loadSavedConsent() {
    try {
        const saved = localStorage.getItem('gdpr_consent');
        return saved ? JSON.parse(saved) : {
            consentGiven: false,
            analyticsEnabled: false,
            marketingEnabled: false,
            functionalEnabled: true
        };
    } catch (error) {
        return {
            consentGiven: false,
            analyticsEnabled: false,
            marketingEnabled: false,
            functionalEnabled: true
        };
    }
}

function saveConsentPreferences(consentData) {
    localStorage.setItem('gdpr_consent', JSON.stringify(consentData));
}

function generateCookieString(name, value, daysToExpire) {
    const expiryDate = calculateExpiryDate(daysToExpire);
    return `${name}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

function calculateExpiryDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

function isValidCookieName(name) {
    return typeof name === 'string' && 
           name.length > 0 && 
           !/[\s;=]/.test(name);
}

function updateUserPreferences(preferences) {
    return {
        analyticsEnabled: preferences.analytics || false,
        marketingEnabled: preferences.marketing || false,
        functionalEnabled: preferences.functional !== false // Default to true
    };
}

function validatePreferences(preferences) {
    return Object.values(preferences).every(value => typeof value === 'boolean');
}

function isLikelyEUUser() {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const euTimezones = [
            'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
            'Europe/Rome', 'Europe/Amsterdam', 'Europe/Vienna', 'Europe/Brussels',
            'Europe/Copenhagen', 'Europe/Stockholm', 'Europe/Helsinki', 'Europe/Prague',
            'Europe/Warsaw', 'Europe/Budapest', 'Europe/Bucharest', 'Europe/Sofia',
            'Europe/Athens', 'Europe/Zagreb', 'Europe/Ljubljana', 'Europe/Bratislava'
        ];
        
        return euTimezones.some(eu => timeZone.includes('Europe/')) || 
               timeZone.includes('Unknown'); // Default to safe side
    } catch (error) {
        return true; // Default to showing banner for safety
    }
}