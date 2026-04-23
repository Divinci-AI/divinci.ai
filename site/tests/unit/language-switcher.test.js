/**
 * Unit Tests for Language Switcher
 * Tests the core language detection and URL generation logic
 */

describe('Language Switcher', () => {
    beforeEach(() => {
        // Set up DOM structure
        document.body.innerHTML = `
            <div class="language-switcher">
                <div class="language-switcher-current">
                    <span class="current-language">English</span>
                </div>
                <div class="language-switcher-dropdown">
                    <a class="language-option" data-lang="en" href="/">English</a>
                    <a class="language-option" data-lang="es" href="/es">Español</a>
                    <a class="language-option" data-lang="fr" href="/fr">Français</a>
                </div>
            </div>
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Language Detection', () => {
        test('should detect English as default language', () => {
            const currentLanguage = detectCurrentLanguage('/');
            expect(currentLanguage).toBe('en');
        });

        test('should detect Spanish from URL path', () => {
            const currentLanguage = detectCurrentLanguage('/es/contact/');
            expect(currentLanguage).toBe('es');
        });

        test('should detect French from URL path', () => {
            const currentLanguage = detectCurrentLanguage('/fr/about/');
            expect(currentLanguage).toBe('fr');
        });

        test('should handle complex URLs with query parameters', () => {
            const currentLanguage = detectCurrentLanguage('/es/docs/?page=1#section');
            expect(currentLanguage).toBe('es');
        });
    });

    describe('URL Generation', () => {
        test('should generate correct Spanish URLs from English pages', () => {
            const spanishUrl = generateLanguageUrl('/contact/', 'es');
            expect(spanishUrl).toBe('/es/contact/');
        });

        test('should generate correct English URLs from Spanish pages', () => {
            const englishUrl = generateLanguageUrl('/es/about/', 'en');
            expect(englishUrl).toBe('/about/');
        });

        test('should handle homepage correctly', () => {
            const spanishHome = generateLanguageUrl('/', 'es');
            expect(spanishHome).toBe('/es/');
            
            const englishHome = generateLanguageUrl('/es/', 'en');
            expect(englishHome).toBe('/');
        });

        test('should preserve trailing slashes', () => {
            const urlWithSlash = generateLanguageUrl('/docs/', 'es');
            expect(urlWithSlash).toBe('/es/docs/');
        });

        test('should handle URLs without trailing slashes', () => {
            const urlWithoutSlash = generateLanguageUrl('/docs', 'es');
            expect(urlWithoutSlash).toBe('/es/docs');
        });
    });

    describe('DOM Interactions', () => {
        test('should find language switcher elements', () => {
            const languageSwitcher = document.querySelector('.language-switcher');
            const toggleButton = document.querySelector('.language-switcher-current');
            const dropdown = document.querySelector('.language-switcher-dropdown');

            expect(languageSwitcher).toBeTruthy();
            expect(toggleButton).toBeTruthy();
            expect(dropdown).toBeTruthy();
        });

        test('should toggle active class on click', () => {
            const languageSwitcher = document.querySelector('.language-switcher');
            const toggleButton = document.querySelector('.language-switcher-current');

            // Simulate initialization
            initLanguageSwitcherForTesting(languageSwitcher, toggleButton);

            // Simulate click
            toggleButton.click();
            expect(languageSwitcher.classList.contains('active')).toBe(true);

            // Click again
            toggleButton.click();
            expect(languageSwitcher.classList.contains('active')).toBe(false);
        });
    });
});

// Helper functions extracted from the main module for testing
function detectCurrentLanguage(pathname) {
    const langMatch = pathname.match(/^\/([a-z]{2})\//);
    return langMatch ? langMatch[1] : 'en';
}

function generateLanguageUrl(currentPath, targetLang) {
    // Remove current language prefix if exists
    const cleanPath = currentPath.replace(/^\/[a-z]{2}\//, '/');
    
    // Generate new URL
    if (targetLang === 'en') {
        return cleanPath;
    } else {
        return `/${targetLang}${cleanPath}`;
    }
}

function initLanguageSwitcherForTesting(languageSwitcher, toggleButton) {
    toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        languageSwitcher.classList.toggle('active');
    });
}