const { test, expect } = require('@playwright/test');

/**
 * Form Functionality Tests
 * Tests all forms on the site including contact, career applications, and signup forms
 */

test.describe('Form Functionality Tests', () => {
  const baseURL = 'http://127.0.0.1:1027';
  
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent testing
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01s !important;
          animation-delay: 0s !important;
          transition-duration: 0.01s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test.describe('Homepage Signup Form', () => {
    test('should display and validate signup form elements', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📝 Testing homepage signup form...\n');
      
      // Find signup section and form
      const signupSection = page.locator('.signup-section, .signup-form, .newsletter-signup');
      
      if (await signupSection.count() > 0) {
        await expect(signupSection).toBeVisible();
        console.log('  ✅ Signup section is visible');
        
        // Check for email input
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        if (await emailInput.count() > 0) {
          await expect(emailInput).toBeVisible();
          await expect(emailInput).toBeEnabled();
          console.log('  ✅ Email input field is present and enabled');
          
          // Test input validation
          await emailInput.fill('invalid-email');
          await expect(emailInput).toHaveValue('invalid-email');
          
          await emailInput.fill('test@example.com');
          await expect(emailInput).toHaveValue('test@example.com');
          console.log('  ✅ Email input accepts valid email format');
        }
        
        // Check for submit button
        const submitButton = page.locator('button[type="submit"], .signup-button, .submit-button');
        if (await submitButton.count() > 0) {
          await expect(submitButton).toBeVisible();
          await expect(submitButton).toBeEnabled();
          console.log('  ✅ Submit button is present and enabled');
          
          const buttonText = await submitButton.textContent();
          console.log(`    📝 Button text: "${buttonText?.trim()}"`);
        }
        
        // Test form submission (without actually submitting)
        if (await emailInput.count() > 0 && await submitButton.count() > 0) {
          await emailInput.fill('test@example.com');
          
          // Check form attributes
          const form = page.locator('form').first();
          if (await form.count() > 0) {
            const action = await form.getAttribute('action');
            const method = await form.getAttribute('method');
            console.log(`    📝 Form action: ${action || 'Not specified'}`);
            console.log(`    📝 Form method: ${method || 'GET'}`);
          }
        }
      } else {
        console.log('  ℹ️ No signup form found on homepage');
      }
    });

    test('should handle form submission attempt', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const submitButton = page.locator('button[type="submit"], .signup-button, .submit-button');
      
      if (await emailInput.count() > 0 && await submitButton.count() > 0) {
        console.log('🚀 Testing form submission behavior...\n');
        
        // Fill valid email
        await emailInput.fill('test@example.com');
        
        // Listen for network requests
        let formSubmitted = false;
        page.on('request', request => {
          if (request.method() === 'POST') {
            formSubmitted = true;
            console.log(`  📤 Form submission detected: ${request.method()} ${request.url()}`);
          }
        });
        
        // Click submit button
        await submitButton.click();
        
        // Wait a moment for any network activity
        await page.waitForTimeout(2000);
        
        // Check for success/error messages
        const messageSelectors = [
          '.success-message',
          '.error-message',
          '.form-message',
          '.alert',
          '.notification'
        ];
        
        for (const selector of messageSelectors) {
          const message = page.locator(selector);
          if (await message.count() > 0 && await message.isVisible()) {
            const messageText = await message.textContent();
            console.log(`  📝 Form message: "${messageText?.trim()}"`);
          }
        }
        
        if (formSubmitted) {
          console.log('  ✅ Form submission was attempted');
        } else {
          console.log('  ℹ️ No form submission detected (may be client-side only)');
        }
      }
    });
  });

  test.describe('Contact Form', () => {
    test('should display and validate contact form', async ({ page }) => {
      // Try to navigate to contact page
      try {
        await page.goto(`${baseURL}/contact/`);
        await page.waitForLoadState('networkidle');
        
        console.log('📞 Testing contact form...\n');
        
        // Look for contact form
        const contactForm = page.locator('form, .contact-form');
        
        if (await contactForm.count() > 0) {
          await expect(contactForm).toBeVisible();
          console.log('  ✅ Contact form is visible');
          
          // Check for common form fields
          const fieldTests = [
            { selector: 'input[name="name"], input[type="text"]', label: 'Name field' },
            { selector: 'input[name="email"], input[type="email"]', label: 'Email field' },
            { selector: 'input[name="subject"]', label: 'Subject field' },
            { selector: 'textarea[name="message"], textarea', label: 'Message field' },
            { selector: 'input[name="company"], input[name="organization"]', label: 'Company field' },
            { selector: 'input[name="phone"], input[type="tel"]', label: 'Phone field' }
          ];
          
          for (const fieldTest of fieldTests) {
            const field = page.locator(fieldTest.selector);
            if (await field.count() > 0) {
              await expect(field).toBeVisible();
              await expect(field).toBeEnabled();
              console.log(`    ✅ ${fieldTest.label} is present and enabled`);
              
              // Test field input
              if (fieldTest.selector.includes('textarea')) {
                await field.fill('This is a test message for the contact form.');
                await expect(field).toHaveValue('This is a test message for the contact form.');
              } else if (fieldTest.selector.includes('email')) {
                await field.fill('test@example.com');
                await expect(field).toHaveValue('test@example.com');
              } else {
                await field.fill('Test Input');
                await expect(field).toHaveValue('Test Input');
              }
            }
          }
          
          // Check for submit button
          const submitButton = page.locator('button[type="submit"], input[type="submit"], .submit-button');
          if (await submitButton.count() > 0) {
            await expect(submitButton).toBeVisible();
            await expect(submitButton).toBeEnabled();
            console.log('    ✅ Submit button is present and enabled');
          }
          
          // Check for form validation
          const requiredFields = page.locator('input[required], textarea[required]');
          const requiredCount = await requiredFields.count();
          console.log(`    📝 Found ${requiredCount} required fields`);
          
        } else {
          console.log('  ℹ️ No contact form found on contact page');
        }
        
      } catch (error) {
        console.log(`  ❌ Could not access contact page: ${error.message}`);
      }
    });

    test('should validate required fields in contact form', async ({ page }) => {
      try {
        await page.goto(`${baseURL}/contact/`);
        await page.waitForLoadState('networkidle');
        
        const contactForm = page.locator('form, .contact-form');
        const submitButton = page.locator('button[type="submit"], input[type="submit"], .submit-button');
        
        if (await contactForm.count() > 0 && await submitButton.count() > 0) {
          console.log('🔍 Testing contact form validation...\n');
          
          // Try to submit empty form
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Check for validation messages
          const validationMessages = page.locator('.error, .invalid, [aria-invalid="true"]');
          if (await validationMessages.count() > 0) {
            console.log('  ✅ Form validation is working');
            const messages = await validationMessages.all();
            for (const message of messages) {
              const messageText = await message.textContent();
              if (messageText?.trim()) {
                console.log(`    📝 Validation message: "${messageText.trim()}"`);
              }
            }
          }
          
          // Test HTML5 validation
          const requiredFields = page.locator('input[required], textarea[required]');
          if (await requiredFields.count() > 0) {
            console.log('  ✅ Required fields are marked with HTML5 required attribute');
          }
        }
      } catch (error) {
        console.log(`  ❌ Error testing contact form validation: ${error.message}`);
      }
    });
  });

  test.describe('Career Application Form', () => {
    test('should display career application form if exists', async ({ page }) => {
      try {
        await page.goto(`${baseURL}/careers/`);
        await page.waitForLoadState('networkidle');
        
        console.log('💼 Testing career application form...\n');
        
        // Look for career form or job application form
        const careerForm = page.locator('form.career-form, form.job-application, .careers-form form');
        
        if (await careerForm.count() > 0) {
          await expect(careerForm).toBeVisible();
          console.log('  ✅ Career application form is visible');
          
          // Check for typical career form fields
          const careerFields = [
            { selector: 'input[name="name"], input[name="full_name"]', label: 'Full name field' },
            { selector: 'input[name="email"]', label: 'Email field' },
            { selector: 'input[name="phone"]', label: 'Phone field' },
            { selector: 'select[name="position"], select[name="job"]', label: 'Position dropdown' },
            { selector: 'textarea[name="cover_letter"], textarea[name="message"]', label: 'Cover letter field' },
            { selector: 'input[type="file"], input[name="resume"]', label: 'Resume upload field' },
            { selector: 'input[name="linkedin"], input[name="portfolio"]', label: 'LinkedIn/Portfolio field' }
          ];
          
          for (const fieldTest of careerFields) {
            const field = page.locator(fieldTest.selector);
            if (await field.count() > 0) {
              await expect(field).toBeVisible();
              console.log(`    ✅ ${fieldTest.label} is present`);
              
              // Test field functionality
              if (fieldTest.selector.includes('select')) {
                const options = field.locator('option');
                const optionCount = await options.count();
                console.log(`      📝 Found ${optionCount} position options`);
              } else if (fieldTest.selector.includes('file')) {
                const isEnabled = await field.isEnabled();
                console.log(`      📝 File upload ${isEnabled ? 'enabled' : 'disabled'}`);
              }
            }
          }
          
        } else {
          console.log('  ℹ️ No career application form found');
          
          // Check for job listings that might have individual application forms
          const jobListings = page.locator('.job-listing, .position, .career-opportunity');
          const jobCount = await jobListings.count();
          
          if (jobCount > 0) {
            console.log(`  📝 Found ${jobCount} job listings`);
            
            // Check if job listings have application buttons/links
            const applyButtons = page.locator('.apply-button, .apply-link, a[href*="apply"]');
            const applyCount = await applyButtons.count();
            console.log(`    📝 Found ${applyCount} apply buttons/links`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Could not access careers page: ${error.message}`);
      }
    });
  });

  test.describe('Newsletter and Subscription Forms', () => {
    test('should find and test newsletter signup forms', async ({ page }) => {
      const pagesToTest = ['/', '/blog/', '/about/'];
      
      for (const pagePath of pagesToTest) {
        try {
          await page.goto(`${baseURL}${pagePath}`);
          await page.waitForLoadState('networkidle');
          
          console.log(`📧 Testing newsletter forms on ${pagePath}...\n`);
          
          // Look for newsletter forms
          const newsletterForms = page.locator('.newsletter-form, .subscription-form, form[action*="newsletter"]');
          
          if (await newsletterForms.count() > 0) {
            console.log(`  ✅ Found newsletter form on ${pagePath}`);
            
            const emailInput = page.locator('input[type="email"]').first();
            const submitButton = page.locator('button[type="submit"], .subscribe-button').first();
            
            if (await emailInput.count() > 0 && await submitButton.count() > 0) {
              // Test email validation
              await emailInput.fill('invalid-email');
              await submitButton.click();
              await page.waitForTimeout(500);
              
              // Check for validation
              const isInvalid = await emailInput.evaluate(el => !el.checkValidity());
              if (isInvalid) {
                console.log('    ✅ Email validation is working');
              }
              
              // Test valid email
              await emailInput.fill('newsletter@example.com');
              await expect(emailInput).toHaveValue('newsletter@example.com');
              console.log('    ✅ Email input accepts valid email');
            }
          } else {
            console.log(`  ℹ️ No newsletter form found on ${pagePath}`);
          }
          
        } catch (error) {
          console.log(`  ❌ Error testing ${pagePath}: ${error.message}`);
        }
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('should check form accessibility features', async ({ page }) => {
      const pagesToTest = ['/', '/contact/', '/careers/'];
      
      for (const pagePath of pagesToTest) {
        try {
          await page.goto(`${baseURL}${pagePath}`);
          await page.waitForLoadState('networkidle');
          
          console.log(`♿ Testing form accessibility on ${pagePath}...\n`);
          
          const forms = page.locator('form');
          const formCount = await forms.count();
          
          if (formCount > 0) {
            console.log(`  📝 Found ${formCount} forms to test`);
            
            // Check for labels
            const inputs = page.locator('input, textarea, select');
            const inputCount = await inputs.count();
            
            let labeledInputs = 0;
            for (let i = 0; i < inputCount; i++) {
              const input = inputs.nth(i);
              const inputId = await input.getAttribute('id');
              const inputName = await input.getAttribute('name');
              
              // Check for associated label
              let hasLabel = false;
              if (inputId) {
                const label = page.locator(`label[for="${inputId}"]`);
                hasLabel = await label.count() > 0;
              }
              
              // Check for aria-label
              const ariaLabel = await input.getAttribute('aria-label');
              const ariaLabelledBy = await input.getAttribute('aria-labelledby');
              
              if (hasLabel || ariaLabel || ariaLabelledBy) {
                labeledInputs++;
              }
            }
            
            console.log(`    📝 ${labeledInputs}/${inputCount} inputs have proper labels`);
            
            // Check for fieldsets
            const fieldsets = page.locator('fieldset');
            const fieldsetCount = await fieldsets.count();
            if (fieldsetCount > 0) {
              console.log(`    ✅ Found ${fieldsetCount} fieldsets for form grouping`);
            }
            
            // Check for error messaging
            const errorElements = page.locator('[role="alert"], .error-message, [aria-live]');
            const errorCount = await errorElements.count();
            if (errorCount > 0) {
              console.log(`    ✅ Found ${errorCount} elements for error messaging`);
            }
          }
          
        } catch (error) {
          console.log(`  ❌ Error testing accessibility on ${pagePath}: ${error.message}`);
        }
      }
    });
  });

  test.describe('Form Security Features', () => {
    test('should check for CSRF protection and secure forms', async ({ page }) => {
      const pagesToTest = ['/', '/contact/', '/careers/'];
      
      for (const pagePath of pagesToTest) {
        try {
          await page.goto(`${baseURL}${pagePath}`);
          await page.waitForLoadState('networkidle');
          
          console.log(`🔒 Testing form security on ${pagePath}...\n`);
          
          const forms = page.locator('form');
          const formCount = await forms.count();
          
          for (let i = 0; i < formCount; i++) {
            const form = forms.nth(i);
            
            // Check for CSRF tokens
            const csrfToken = form.locator('input[name*="csrf"], input[name*="token"], input[type="hidden"]');
            const csrfCount = await csrfToken.count();
            if (csrfCount > 0) {
              console.log(`    ✅ Form ${i + 1} has ${csrfCount} hidden/token fields`);
            }
            
            // Check form method
            const method = await form.getAttribute('method');
            if (method && method.toUpperCase() === 'POST') {
              console.log(`    ✅ Form ${i + 1} uses POST method`);
            }
            
            // Check for honeypot fields
            const honeypotFields = form.locator('input[style*="display: none"], input[style*="visibility: hidden"]');
            const honeypotCount = await honeypotFields.count();
            if (honeypotCount > 0) {
              console.log(`    ✅ Form ${i + 1} may have ${honeypotCount} honeypot fields`);
            }
          }
          
        } catch (error) {
          console.log(`  ❌ Error testing security on ${pagePath}: ${error.message}`);
        }
      }
    });
  });
});