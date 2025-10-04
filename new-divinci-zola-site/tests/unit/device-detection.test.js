/**
 * Unit Tests for Device Detection and Performance Optimization
 * Tests device detection, performance optimization, and video management logic
 */

// Mock window and navigator
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080,
});

describe('Device Detection and Performance', () => {
    beforeEach(() => {
        // Reset window dimensions
        window.innerWidth = 1920;
        window.innerHeight = 1080;
        
        // Mock matchMedia
        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));

        // Mock navigator
        Object.defineProperty(navigator, 'connection', {
            writable: true,
            value: {
                effectiveType: '4g',
                downlink: 10,
                rtt: 100
            }
        });
    });

    describe('Device Detection', () => {
        test('should detect desktop devices correctly', () => {
            window.innerWidth = 1920;
            expect(isMobileDevice()).toBe(false);
            expect(isTabletDevice()).toBe(false);
            expect(isDesktopDevice()).toBe(true);
        });

        test('should detect mobile devices correctly', () => {
            window.innerWidth = 480;
            expect(isMobileDevice()).toBe(true);
            expect(isTabletDevice()).toBe(false);
            expect(isDesktopDevice()).toBe(false);
        });

        test('should detect tablet devices correctly', () => {
            window.innerWidth = 800;
            expect(isMobileDevice()).toBe(false);
            expect(isTabletDevice()).toBe(true);
            expect(isDesktopDevice()).toBe(false);
        });

        test('should handle edge cases in device detection', () => {
            // Exactly at mobile breakpoint
            window.innerWidth = 768;
            expect(isMobileDevice()).toBe(true);

            // Exactly at tablet breakpoint  
            window.innerWidth = 1024;
            expect(isTabletDevice()).toBe(true);
        });
    });

    describe('Performance Optimization', () => {
        test('should detect reduced motion preference', () => {
            window.matchMedia.mockImplementation(query => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }));

            expect(prefersReducedMotion()).toBe(true);
        });

        test('should optimize for slow connections', () => {
            navigator.connection.effectiveType = '2g';
            navigator.connection.downlink = 0.5;

            expect(shouldOptimizeForConnection()).toBe(true);
        });

        test('should not optimize for fast connections', () => {
            navigator.connection.effectiveType = '4g';
            navigator.connection.downlink = 10;

            expect(shouldOptimizeForConnection()).toBe(false);
        });

        test('should handle missing connection API gracefully', () => {
            Object.defineProperty(navigator, 'connection', {
                value: undefined
            });

            // Should default to conservative approach
            expect(shouldOptimizeForConnection()).toBe(true);
        });
    });

    describe('Battery Optimization', () => {
        test('should optimize for low battery', () => {
            const mockBattery = {
                level: 0.15,
                charging: false
            };

            expect(shouldOptimizeForBattery(mockBattery)).toBe(true);
        });

        test('should not optimize when charging', () => {
            const mockBattery = {
                level: 0.15,
                charging: true
            };

            expect(shouldOptimizeForBattery(mockBattery)).toBe(false);
        });

        test('should not optimize for high battery', () => {
            const mockBattery = {
                level: 0.8,
                charging: false
            };

            expect(shouldOptimizeForBattery(mockBattery)).toBe(false);
        });
    });

    describe('Video Management', () => {
        test('should determine video loading based on device and connection', () => {
            // Mobile + slow connection = no video
            window.innerWidth = 480;
            navigator.connection.effectiveType = '2g';
            
            const shouldLoad = shouldLoadVideos({
                isMobile: true,
                connectionQuality: 'slow',
                prefersReducedMotion: false
            });

            expect(shouldLoad).toBe(false);
        });

        test('should load videos on desktop with good connection', () => {
            window.innerWidth = 1920;
            navigator.connection.effectiveType = '4g';
            
            const shouldLoad = shouldLoadVideos({
                isMobile: false,
                connectionQuality: 'fast',
                prefersReducedMotion: false
            });

            expect(shouldLoad).toBe(true);
        });

        test('should respect reduced motion preferences', () => {
            const shouldLoad = shouldLoadVideos({
                isMobile: false,
                connectionQuality: 'fast',
                prefersReducedMotion: true
            });

            expect(shouldLoad).toBe(false);
        });
    });

    describe('Screen Density Detection', () => {
        test('should detect high DPI screens', () => {
            Object.defineProperty(window, 'devicePixelRatio', {
                value: 2.0
            });

            expect(isHighDPIScreen()).toBe(true);
        });

        test('should detect standard DPI screens', () => {
            Object.defineProperty(window, 'devicePixelRatio', {
                value: 1.0
            });

            expect(isHighDPIScreen()).toBe(false);
        });
    });
});

// Helper functions extracted for testing
function isMobileDevice() {
    return window.innerWidth <= 768;
}

function isTabletDevice() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktopDevice() {
    return window.innerWidth > 1024;
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function shouldOptimizeForConnection() {
    if (!navigator.connection) {
        return true; // Conservative approach
    }

    const slowConnections = ['slow-2g', '2g', '3g'];
    return slowConnections.includes(navigator.connection.effectiveType) ||
           navigator.connection.downlink < 1.5;
}

function shouldOptimizeForBattery(battery) {
    if (!battery) return false;
    
    return battery.level < 0.2 && !battery.charging;
}

function shouldLoadVideos(conditions) {
    const { isMobile, connectionQuality, prefersReducedMotion } = conditions;
    
    if (prefersReducedMotion) return false;
    if (isMobile && connectionQuality === 'slow') return false;
    
    return connectionQuality === 'fast' && !isMobile;
}

function isHighDPIScreen() {
    return window.devicePixelRatio > 1.5;
}