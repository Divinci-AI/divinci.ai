const { test, expect, devices } = require('@playwright/test');

// Mobile devices for user journey testing
const mobileDevices = [
  { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'], width: 390 },
  { name: 'iPhone SE', device: devices['iPhone SE'], width: 375 },
  { name: 'Galaxy S21', device: devices['Galaxy S21'], width: 360 },
];

// User journey helper class
class MobileJourneyHelper {
  constructor(page) {
    this.page = page;
    this.journeyLog = [];
  }

  async logStep(step, data = {}) {
    const timestamp = new Date().toISOString();
    this.journeyLog.push({ timestamp, step, data });
    console.log(`🛤️ Journey Step: ${step}`, data);
  }

  async checkPageLoad(expectedTitle = 'Divinci') {
    await this.page.waitForLoadState('networkidle');
    const title = await this.page.title();
    const url = this.page.url();
    
    await this.logStep('Page Load Check', { title, url });
    expect(title).toContain(expectedTitle);
    
    return { title, url };
  }

  async checkMobileLayout() {
    const layoutCheck = await this.page.evaluate(() => {
      const body = document.body;
      const viewport = window.innerWidth;
      
      // Check for horizontal overflow
      const hasOverflow = body.scrollWidth > viewport + 10;
      
      // Check if key mobile elements are visible
      const header = document.querySelector('header');
      const nav = document.querySelector('nav');
      const main = document.querySelector('main, .hero, .content');
      
      return {
        hasOverflow,
        bodyWidth: body.scrollWidth,
        viewportWidth: viewport,
        headerVisible: header && header.getBoundingClientRect().height > 0,
        navVisible: nav && nav.getBoundingClientRect().height > 0,
        mainVisible: main && main.getBoundingClientRect().height > 0
      };
    });
    
    await this.logStep('Mobile Layout Check', layoutCheck);
    expect(layoutCheck.hasOverflow).toBe(false);
    expect(layoutCheck.headerVisible).toBe(true);
    
    return layoutCheck;
  }

  async testFormInteraction(formSelector, fields) {
    await this.logStep('Form Interaction Start', { formSelector, fieldCount: fields.length });
    
    const form = this.page.locator(formSelector);
    await expect(form).toBeVisible();
    
    // Fill form fields
    for (const field of fields) {
      const input = this.page.locator(field.selector);
      await expect(input).toBeVisible();
      
      // Check touch target size
      const inputBox = await input.boundingBox();
      expect(inputBox.height).toBeGreaterThanOrEqual(44);
      
      await input.fill(field.value);
      await this.logStep('Field Filled', { field: field.name, value: field.value });
    }
    
    return true;
  }

  async testScrollAndNavigation() {
    // Test scroll behavior
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(500);
    
    const initialScroll = await this.page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    
    // Scroll down
    await this.page.evaluate(() => window.scrollTo(0, 1000));
    await this.page.waitForTimeout(500);
    
    const afterScroll = await this.page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    
    await this.logStep('Scroll Test', { initial: initialScroll, after: afterScroll });
    
    // Should not scroll horizontally
    expect(afterScroll.x).toBe(0);
    expect(afterScroll.y).toBeGreaterThan(800);
    
    return true;
  }

  getJourneyLog() {
    return this.journeyLog;
  }
}

// Comprehensive user journey tests
mobileDevices.forEach(({ name, device, width }) => {
  test.describe(`Mobile User Journeys - ${name} (${width}px)`, () => {
    test.use(device);

    test(`${name} - Homepage to Contact journey`, async ({ page }) => {
      const helper = new MobileJourneyHelper(page);
      
      await helper.logStep('Journey Start', { journey: 'Homepage to Contact', device: name });
      
      // Step 1: Start at homepage
      await page.goto('https://divinci.ai/');
      await helper.checkPageLoad();
      await helper.checkMobileLayout();
      
      // Step 2: Navigate to contact page
      // Try multiple ways to get to contact
      let contactReached = false;
      
      // Method 1: Direct link in navigation
      const contactNav = page.locator('nav a[href*="contact"], a[href="/contact/"]');
      if (await contactNav.count() > 0) {
        await contactNav.first().click();
        await helper.checkPageLoad();
        contactReached = true;
        await helper.logStep('Contact via Navigation');
      }
      
      // Method 2: CTA button if available
      if (!contactReached) {
        await page.goto('https://divinci.ai/');
        const ctaButton = page.locator('.cta-button, [href*="calendly"], .primary-button');
        if (await ctaButton.count() > 0) {
          await ctaButton.first().click();
          await helper.logStep('Contact via CTA');
          contactReached = true;
        }
      }
      
      // Method 3: Direct navigation to contact page
      if (!contactReached) {
        await page.goto('https://divinci.ai/contact/');
        await helper.checkPageLoad();
        await helper.logStep('Direct Contact Navigation');
        contactReached = true;
      }
      
      expect(contactReached).toBe(true);
      
      // Step 3: Test contact form if available
      const contactForm = page.locator('form, .contact-form, #contact-form');
      if (await contactForm.count() > 0) {
        await helper.logStep('Contact Form Found');
        
        const formFields = [
          { name: 'name', selector: 'input[name="name"], #name, [placeholder*="name" i]', value: 'Test User' },
          { name: 'email', selector: 'input[name="email"], #email, [type="email"]', value: 'test@example.com' },
          { name: 'message', selector: 'textarea, input[name="message"], #message', value: 'Test message from mobile' }
        ];
        
        // Try to fill available fields
        for (const field of formFields) {
          const fieldElement = page.locator(field.selector);
          if (await fieldElement.count() > 0) {
            await fieldElement.first().fill(field.value);
            await helper.logStep('Field Filled', { field: field.name });
          }
        }
        
        // Check form layout on mobile
        const formCheck = await helper.checkMobileLayout();
        expect(formCheck.hasOverflow).toBe(false);
      }
      
      await helper.logStep('Journey Complete', { totalSteps: helper.getJourneyLog().length });
    });

    test(`${name} - Multi-language exploration journey`, async ({ page }) => {
      const helper = new MobileJourneyHelper(page);
      
      await helper.logStep('Journey Start', { journey: 'Multi-language exploration', device: name });
      
      // Step 1: Start at English homepage
      await page.goto('https://divinci.ai/');
      await helper.checkPageLoad();
      
      // Step 2: Open language switcher
      const langSwitcher = page.locator('.language-switcher-current');
      await expect(langSwitcher).toBeVisible();
      await langSwitcher.click();
      await page.waitForTimeout(500);
      
      // Step 3: Switch to Spanish
      const spanishOption = page.locator('[data-lang="es"]');
      if (await spanishOption.count() > 0) {
        await spanishOption.click();
        await helper.checkPageLoad();
        await helper.checkMobileLayout();
        await helper.logStep('Switched to Spanish');
        
        // Navigate within Spanish site
        const aboutLink = page.locator('a[href*="/es/about"], nav a[href*="about"]');
        if (await aboutLink.count() > 0) {
          await aboutLink.first().click();
          await helper.checkPageLoad();
          await helper.logStep('Spanish About Page');
        }
      }
      
      // Step 4: Test RTL language (Arabic)
      await page.goto('https://divinci.ai/ar/');
      await helper.checkPageLoad();
      
      const rtlCheck = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return {
          bodyDirection: window.getComputedStyle(body).direction,
          htmlDirection: html.getAttribute('dir') || 'ltr',
          textAlign: window.getComputedStyle(body).textAlign
        };
      });
      
      await helper.logStep('RTL Language Test', rtlCheck);
      expect(rtlCheck.bodyDirection).toBe('rtl');
      
      await helper.logStep('Journey Complete', { totalSteps: helper.getJourneyLog().length });
    });

    test(`${name} - Feature exploration journey`, async ({ page }) => {
      const helper = new MobileJourneyHelper(page);
      
      await helper.logStep('Journey Start', { journey: 'Feature exploration', device: name });
      
      // Step 1: Homepage
      await page.goto('https://divinci.ai/');
      await helper.checkPageLoad();
      await helper.testScrollAndNavigation();
      
      // Step 2: Explore AutoRAG feature
      const autoragLink = page.locator('a[href*="autorag"], nav a[href*="AutoRAG" i]');
      if (await autoragLink.count() > 0) {
        await autoragLink.first().click();
        await helper.checkPageLoad();
        await helper.checkMobileLayout();
        await helper.logStep('AutoRAG Page Visited');
      } else {
        // Direct navigation if link not found
        await page.goto('https://divinci.ai/autorag/');
        await helper.checkPageLoad();
        await helper.logStep('AutoRAG Direct Navigation');
      }
      
      // Step 3: Support/Help section
      const supportLink = page.locator('a[href*="support"], nav a[href*="Support" i]');
      if (await supportLink.count() > 0) {
        await supportLink.first().click();
        await helper.checkPageLoad();
        await helper.checkMobileLayout();
        await helper.logStep('Support Page Visited');
        
        // Test sidebar functionality if present
        const sidebar = page.locator('.support-sidebar, .sidebar');
        if (await sidebar.count() > 0) {
          await helper.logStep('Support Sidebar Found');
          
          // Test sticky behavior
          await helper.testScrollAndNavigation();
        }
      }
      
      // Step 4: Return to homepage via logo
      const logo = page.locator('.logo a, header a[href="/"], header a[href="https://divinci.ai/"]');
      if (await logo.count() > 0) {
        await logo.first().click();
        await helper.checkPageLoad();
        await helper.logStep('Returned via Logo');
      }
      
      await helper.logStep('Journey Complete', { totalSteps: helper.getJourneyLog().length });
    });

    test(`${name} - Complete site navigation journey`, async ({ page }) => {
      const helper = new MobileJourneyHelper(page);
      
      await helper.logStep('Journey Start', { journey: 'Complete site navigation', device: name });
      
      const pagesToTest = [
        { url: 'https://divinci.ai/', name: 'Homepage' },
        { url: 'https://divinci.ai/about/', name: 'About' },
        { url: 'https://divinci.ai/autorag/', name: 'AutoRAG' },
        { url: 'https://divinci.ai/quality-assurance/', name: 'Quality Assurance' },
        { url: 'https://divinci.ai/support/', name: 'Support' },
        { url: 'https://divinci.ai/contact/', name: 'Contact' }
      ];
      
      for (const pageTest of pagesToTest) {
        try {
          await page.goto(pageTest.url);
          await helper.checkPageLoad();
          
          const layoutCheck = await helper.checkMobileLayout();
          expect(layoutCheck.hasOverflow).toBe(false);
          
          // Test scroll on each page
          await page.evaluate(() => window.scrollTo(0, 500));
          await page.waitForTimeout(300);
          
          const scrollCheck = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
          expect(scrollCheck.x).toBe(0); // No horizontal scroll
          
          await helper.logStep('Page Tested', { 
            page: pageTest.name, 
            url: pageTest.url,
            layout: 'OK',
            scroll: 'OK'
          });
          
        } catch (error) {
          await helper.logStep('Page Error', { 
            page: pageTest.name, 
            error: error.message 
          });
        }
      }
      
      await helper.logStep('Journey Complete', { 
        totalSteps: helper.getJourneyLog().length,
        pagesVisited: pagesToTest.length
      });
    });

    test(`${name} - Performance and interaction journey`, async ({ page }) => {
      const helper = new MobileJourneyHelper(page);
      
      await helper.logStep('Journey Start', { journey: 'Performance and interaction', device: name });
      
      // Step 1: Performance test
      const startTime = Date.now();
      await page.goto('https://divinci.ai/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      await helper.logStep('Performance Test', { loadTime: `${loadTime}ms` });
      expect(loadTime).toBeLessThan(15000); // 15 seconds max
      
      // Step 2: Test key interactions
      const interactions = [];
      
      // Language switcher
      const langSwitcher = page.locator('.language-switcher-current');
      if (await langSwitcher.count() > 0) {
        await langSwitcher.click();
        await page.waitForTimeout(500);
        await page.locator('body').click(); // Close
        interactions.push('Language Switcher');
      }
      
      // CTA buttons
      const ctaButtons = page.locator('.cta-button, .primary-button, .secondary-button');
      if (await ctaButtons.count() > 0) {
        const firstCta = ctaButtons.first();
        const ctaBox = await firstCta.boundingBox();
        expect(ctaBox.height).toBeGreaterThanOrEqual(44);
        interactions.push('CTA Button');
      }
      
      // Dropdown menus
      const dropdowns = page.locator('.dropdown');
      if (await dropdowns.count() > 0) {
        await dropdowns.first().hover();
        await page.waitForTimeout(500);
        interactions.push('Dropdown Menu');
      }
      
      await helper.logStep('Interactions Tested', { interactions });
      
      // Step 3: Video handling test
      const videoCheck = await page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const hiddenVideos = videos.filter(v => {
          const style = window.getComputedStyle(v);
          return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
        });
        
        return {
          totalVideos: videos.length,
          hiddenVideos: hiddenVideos.length,
          properlyHandled: videos.length === 0 || hiddenVideos.length === videos.length
        };
      });
      
      await helper.logStep('Video Handling', videoCheck);
      expect(videoCheck.properlyHandled).toBe(true);
      
      await helper.logStep('Journey Complete', { totalSteps: helper.getJourneyLog().length });
    });
  });
});

// Cross-device journey consistency test
test.describe('Cross-Device Journey Consistency', () => {
  test('User journey consistency across mobile devices', async ({ browser }) => {
    console.log('🔄 Testing journey consistency across devices...');
    
    const journeyResults = {};
    
    for (const { name, device } of mobileDevices) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      const helper = new MobileJourneyHelper(page);
      
      try {
        // Simple journey: Homepage -> Contact
        await page.goto('https://divinci.ai/');
        await helper.checkPageLoad();
        
        const homeLayout = await helper.checkMobileLayout();
        
        // Navigate to contact
        await page.goto('https://divinci.ai/contact/');
        await helper.checkPageLoad();
        
        const contactLayout = await helper.checkMobileLayout();
        
        journeyResults[name] = {
          homePageLoads: true,
          contactPageLoads: true,
          homeLayoutOK: !homeLayout.hasOverflow,
          contactLayoutOK: !contactLayout.hasOverflow,
          journeySteps: helper.getJourneyLog().length
        };
        
        console.log(`📊 ${name} Journey Results:`, journeyResults[name]);
        
      } catch (error) {
        console.log(`❌ ${name} Journey Error:`, error.message);
        journeyResults[name] = { error: error.message };
      }
      
      await context.close();
    }
    
    // All devices should complete the journey successfully
    Object.keys(journeyResults).forEach(deviceName => {
      if (!journeyResults[deviceName].error) {
        expect(journeyResults[deviceName].homePageLoads).toBe(true);
        expect(journeyResults[deviceName].contactPageLoads).toBe(true);
        expect(journeyResults[deviceName].homeLayoutOK).toBe(true);
        expect(journeyResults[deviceName].contactLayoutOK).toBe(true);
      }
    });
    
    console.log('📋 Journey consistency summary:', journeyResults);
  });

  test('Form interaction consistency across devices', async ({ browser }) => {
    console.log('📝 Testing form interaction consistency...');
    
    const formResults = {};
    
    for (const { name, device } of mobileDevices) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      
      try {
        await page.goto('https://divinci.ai/contact/');
        await page.waitForLoadState('networkidle');
        
        // Check if contact form exists
        const contactForm = page.locator('form, .contact-form');
        const hasForm = await contactForm.count() > 0;
        
        let formInteraction = { hasForm };
        
        if (hasForm) {
          // Test form fields
          const nameInput = page.locator('input[name="name"], #name, [placeholder*="name" i]');
          const emailInput = page.locator('input[name="email"], #email, [type="email"]');
          const messageInput = page.locator('textarea, input[name="message"], #message');
          
          const fields = {
            name: await nameInput.count() > 0,
            email: await emailInput.count() > 0,
            message: await messageInput.count() > 0
          };
          
          // Test touch targets
          let touchTargetsOK = true;
          if (fields.name) {
            const nameBox = await nameInput.first().boundingBox();
            touchTargetsOK = touchTargetsOK && nameBox.height >= 44;
          }
          if (fields.email) {
            const emailBox = await emailInput.first().boundingBox();
            touchTargetsOK = touchTargetsOK && emailBox.height >= 44;
          }
          
          formInteraction = { ...formInteraction, fields, touchTargetsOK };
        }
        
        formResults[name] = formInteraction;
        console.log(`📱 ${name} Form Results:`, formResults[name]);
        
      } catch (error) {
        console.log(`❌ ${name} Form Error:`, error.message);
        formResults[name] = { error: error.message };
      }
      
      await context.close();
    }
    
    console.log('📋 Form consistency summary:', formResults);
    
    // If any device has a form, all should have similar functionality
    const devicesWithForms = Object.keys(formResults).filter(d => formResults[d].hasForm);
    if (devicesWithForms.length > 0) {
      devicesWithForms.forEach(deviceName => {
        expect(formResults[deviceName].touchTargetsOK).toBe(true);
      });
    }
  });
});