# Test info

- Name: Mobile Accessibility Analysis >> Mobile - High Contrast Mode Test
- Location: /Users/mikeumus/Documents/divinci.ai/tests/visual/mobile-accessibility-analysis.spec.ts:228:7

# Error details

```
Error: Timed out 5000ms waiting for expect(page).toHaveScreenshot(expected)

  Failed to take two consecutive stable screenshots.
Previous: /Users/mikeumus/Documents/divinci.ai/test-results/mobile-accessibility-analy-895b2-e---High-Contrast-Mode-Test-iPhone-13/mobile-high-contrast-reveal-previous.png
Received: /Users/mikeumus/Documents/divinci.ai/test-results/mobile-accessibility-analy-895b2-e---High-Contrast-Mode-Test-iPhone-13/mobile-high-contrast-reveal-actual.png
    Diff: /Users/mikeumus/Documents/divinci.ai/test-results/mobile-accessibility-analy-895b2-e---High-Contrast-Mode-Test-iPhone-13/mobile-high-contrast-reveal-diff.png

Call log:
  - expect.toHaveScreenshot(mobile-high-contrast-reveal.png) with timeout 5000ms
    - generating new stable screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - Expected an image 670px by 10889px, received 715px by 10889px. 684831 pixels (ratio 0.09 of all image pixels) are different.
  - waiting 250ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 5334 pixels (ratio 0.01 of all image pixels) are different.
  - waiting 500ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 5019 pixels (ratio 0.01 of all image pixels) are different.
  - waiting 1000ms before taking screenshot
  - Timeout 5000ms exceeded.

    at /Users/mikeumus/Documents/divinci.ai/tests/visual/mobile-accessibility-analysis.spec.ts:257:24
```

# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- banner:
  - navigation:
    - link "Divinci Heart Robot logo Divinci ™":
      - /url: ""
      - img "Divinci Heart Robot logo"
      - text: Divinci ™
    - link "Features":
      - /url: "#features"
    - link "Team":
      - /url: "#team"
    - link "Sign Up":
      - /url: "#signup"
    - text:  English ▼
- main:
  - img "Divinci Heart Robot logo black and white"
  - heading "Your AI for Life's Journey, with friends!" [level=1]
  - img
  - text: 👴
  - img "ChatGPT"
  - text: 🧑🏽‍🦱
  - img "Claude AI"
  - text: Love that! 😍 👨🏻 🌞 Facts! 💯
  - img "Google Gemini"
  - text: 🤠
  - img "Grok AI"
  - text: 😺 👽 🧑🏾‍🦰
  - img "Perplexity AI"
  - text: 🧔🏽‍♂️ 🤖 🚀 Staged model releases for safe deployments 👱‍♀️ 🐸 👥 Multiplayer
  - paragraph: Invite more of your human buddies into a chat with your favorite AIs.
  - text: 🤖 AI Family
  - paragraph: Choose from ChatGPT, Gemini, Claude, Llama, and many more!
  - text: 🗣️ Voice In/Out
  - paragraph: Fancy AI Voices from Google to have your answers read to you in a natural-sounding voice. Use your mic to chat text in.
  - text: 📊 Images, Diagrams, Graphs, Charts
  - paragraph: Divinci™ knows when you're asking to generate an image, chart or diagram.
  - text: ✅
  - link "Quality Assurance":
    - /url: features/quality-assurance/llm-quality-assurance.html
  - paragraph: Our friendly quality checks make sure AI answers are helpful and accurate for you.
  - text: 💬 Text Messaging
  - paragraph: Text Divinci™ while you're out on the go, hands-free with "Hey Siri/Google, text Divinci".
  - text: 🔄
  - link "Release Management":
    - /url: features/development-tools/release-cycle-management.html
  - paragraph: Regular updates that bring you new features and improvements to enhance your AI experience.
  - text: 🔒 Sharable/Private Chats
  - paragraph: Share Chats with friends to join in. Make a chat publicly readable or make a chat completely private.
  - text: 📚
  - link "Retrieval Augmentation":
    - /url: features/data-management/autorag.html
  - paragraph: Upload files to your chat to make a custom AI that learns those files and prioritizes them in answering.
  - text: 👨‍⚕️
  - link "Expert AIs":
    - /url: https://galvani.ai/
  - text: (coming soon)
  - paragraph: Expert AIs trained by teams of industry veterans.
  - text: Founder
  - img "Michael-Mooring"
  - text: Mike Mooring
  - paragraph: 15+ Years Software Experience Serial Software Entrepreneur
  - link "Michaelduanemooring":
    - /url: https://www.linkedin.com/in/michaelduanemooring/
    - img
  - text: CTO
  - img "Samual Tobia"
  - text: Samuel Tobia
  - paragraph: 15+ Years Software Experience Principle Software Engineer
  - link "Sam Tobia 1aa2762b":
    - /url: https://www.linkedin.com/in/sam-tobia-1aa2762b/
    - img
  - text: COO
  - img "Sierra Hooshiari"
  - text: Sierra Hooshiari
  - paragraph: Founder/CEO of BrainPOP Drink Cornell ILR Business School
  - link "Sierrahooshiari":
    - /url: https://www.linkedin.com/in/sierrahooshiari/
    - img
  - text: Founding Engineer
  - img "Abdul-Sarnor"
  - text: Abdul Sarnor
  - paragraph: Former Peechy Founding Engineer
  - link "Abdul Sarnor":
    - /url: https://www.linkedin.com/in/abdul-sarnor/
    - img
  - text: ML Engineer
  - img "sean-fuhrman"
  - text: Sean Fuhrman
  - paragraph: SEELab at UCSD Published Data Scientist
  - link "Sean Fuhrman":
    - /url: https://www.linkedin.com/in/sean-fuhrman/
    - img
  - text: CPO
  - img "duane-mooring"
  - text: Duane Mooring
  - paragraph: Former Manager at Sitrof (sold) Lifetime experience of management
  - text: Advisor
  - img "dr-joel-fuhrman"
  - text: Dr.Joel Fuhrman
  - paragraph: 7x NY Times Best Seller Renowned physician and author
  - link "🌐":
    - /url: https://www.drfuhrman.com/
  - heading "Sign up, Stay tuned!" [level=1]
  - text: Your Email
  - textbox "Your Email"
  - button "Subscribe"
  - text: AI for Good
  - 'link "AI for Impact: Inside LA''s Homelessness Prevention Pilot Program"':
    - /url: https://lu.ma/cmuj911s
    - 'img "AI for Impact: Inside LA''s Homelessness Prevention Pilot Program"'
  - text: "AI for Impact: Inside LA's Homelessness Prevention Pilot Program"
  - paragraph: Divinci AI is proud to support initiatives that use artificial intelligence for social good. Join us for this upcoming event from AI LA that explores how AI is being used to address homelessness in Los Angeles through innovative prevention programs.
  - link "Learn More":
    - /url: https://lu.ma/cmuj911s
  - heading "Share this event" [level=2]
  - link "Share on Twitter":
    - /url: https://twitter.com/intent/tweet?url=https%3A%2F%2Flu.ma%2Fcmuj911s&text=Join%20this%20event%20exploring%20how%20AI%20is%20being%20used%20to%20address%20homelessness%20in%20Los%20Angeles%20through%20innovative%20prevention%20programs.&via=DivinciAI
    - text: 
  - link "Share on LinkedIn":
    - /url: https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Flu.ma%2Fcmuj911s
    - text: 
  - link "Share on Facebook":
    - /url: https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Flu.ma%2Fcmuj911s
    - text: 
  - button "Copy link": 
- contentinfo:
  - text: 🖤 Divinci AI
  - paragraph: Empowering human-AI collaboration
  - link "Twitter":
    - /url: https://twitter.com/DivinciAI
    - text: 
  - link "LinkedIn":
    - /url: https://www.linkedin.com/company/divinci-ai
    - text: 
  - link "GitHub":
    - /url: https://github.com/Divinci-AI
    - text: 
  - text: Product
  - list:
    - listitem:
      - link "Features":
        - /url: "#features"
    - listitem:
      - link "Pricing":
        - /url: pricing.html
    - listitem:
      - link "Roadmap":
        - /url: roadmap.html
    - listitem:
      - link "Changelog":
        - /url: changelog.html
  - text: Resources
  - list:
    - listitem:
      - link "Documentation":
        - /url: docs/
    - listitem:
      - link "Blog":
        - /url: blog/
    - listitem:
      - link "Tutorials":
        - /url: tutorials/
    - listitem:
      - link "API":
        - /url: api/
  - text: Company
  - list:
    - listitem:
      - link "About Us":
        - /url: about-us.html
    - listitem:
      - link "Careers":
        - /url: careers.html
    - listitem:
      - link "Contact":
        - /url: contact.html
    - listitem:
      - link "Press":
        - /url: press.html
  - text: Legal
  - list:
    - listitem:
      - link "Terms of Service":
        - /url: terms-of-service.html
    - listitem:
      - link "Privacy Policy":
        - /url: privacy-policy.html
    - listitem:
      - link "AI Safety & Ethics":
        - /url: ai-safety-ethics.html
    - listitem:
      - link "Security":
        - /url: security.html
  - paragraph: © 2023-2025 Divinci AI. All rights reserved.
  - link "Sitemap":
    - /url: sitemap.xml
  - link "Accessibility":
    - /url: accessibility.html
  - link "Cookie Policy":
    - /url: cookies.html
- status
- alert
- text: 🚀 Create your own personal AI assistant Love that! 😍 Amazing! ⭐
```

# Test source

```ts
  157 |       
  158 |       // Search for similar text patterns
  159 |       const similarElements = await page.locator('text=/AI/i').all();
  160 |       console.log(`Found ${similarElements.length} elements containing "AI"`);
  161 |       
  162 |       if (similarElements.length > 0) {
  163 |         const firstAI = similarElements[0];
  164 |         await firstAI.scrollIntoViewIfNeeded();
  165 |         await expect(firstAI).toHaveScreenshot('mobile-ai-text-found.png');
  166 |       }
  167 |     }
  168 |   });
  169 |
  170 |   test('Mobile - Computed Styles Analysis', async ({ page }) => {
  171 |     await page.goto('/');
  172 |     await page.waitForLoadState('networkidle');
  173 |     
  174 |     // Analyze computed styles for contrast issues
  175 |     const contrastIssues = await page.evaluate(() => {
  176 |       const issues = [];
  177 |       const elements = document.querySelectorAll('*');
  178 |       
  179 |       elements.forEach((el, index) => {
  180 |         if (el.textContent && el.textContent.trim()) {
  181 |           const styles = window.getComputedStyle(el);
  182 |           const color = styles.color;
  183 |           const backgroundColor = styles.backgroundColor;
  184 |           
  185 |           // Check for potential white-on-white or light-on-light issues
  186 |           if (
  187 |             (color.includes('255, 255, 255') || color.includes('rgb(255, 255, 255)') || color === 'white') &&
  188 |             (backgroundColor.includes('255, 255, 255') || backgroundColor.includes('rgb(255, 255, 255)') || backgroundColor === 'white' || backgroundColor === 'rgba(0, 0, 0, 0)')
  189 |           ) {
  190 |             issues.push({
  191 |               index,
  192 |               text: el.textContent.trim().substring(0, 50),
  193 |               color,
  194 |               backgroundColor,
  195 |               tagName: el.tagName,
  196 |               className: el.className
  197 |             });
  198 |           }
  199 |         }
  200 |       });
  201 |       
  202 |       return issues;
  203 |     });
  204 |     
  205 |     console.log('Potential contrast issues found:', contrastIssues);
  206 |     
  207 |     // Take screenshot with issues highlighted
  208 |     if (contrastIssues.length > 0) {
  209 |       await page.addStyleTag({
  210 |         content: `
  211 |           /* Highlight elements with potential contrast issues */
  212 |           ${contrastIssues.map((issue, i) => `
  213 |             *:nth-child(${issue.index + 1}) {
  214 |               outline: 3px solid red !important;
  215 |               background: yellow !important;
  216 |             }
  217 |           `).join('\n')}
  218 |         `
  219 |       });
  220 |       
  221 |       await expect(page).toHaveScreenshot('mobile-contrast-issues-highlighted.png', {
  222 |         fullPage: true,
  223 |         animations: 'disabled',
  224 |       });
  225 |     }
  226 |   });
  227 |
  228 |   test('Mobile - High Contrast Mode Test', async ({ page }) => {
  229 |     await page.goto('/');
  230 |     await page.waitForLoadState('networkidle');
  231 |     
  232 |     // Apply high contrast styles to reveal hidden text
  233 |     await page.addStyleTag({
  234 |       content: `
  235 |         * {
  236 |           filter: contrast(200%) brightness(150%) !important;
  237 |         }
  238 |         
  239 |         /* Force all text to be visible */
  240 |         * {
  241 |           color: #000 !important;
  242 |           background-color: #fff !important;
  243 |         }
  244 |         
  245 |         /* Alternate high contrast */
  246 |         body {
  247 |           background: #000 !important;
  248 |         }
  249 |         
  250 |         * {
  251 |           color: #fff !important;
  252 |           text-shadow: 1px 1px 0 #000 !important;
  253 |         }
  254 |       `
  255 |     });
  256 |     
> 257 |     await expect(page).toHaveScreenshot('mobile-high-contrast-reveal.png', {
      |                        ^ Error: Timed out 5000ms waiting for expect(page).toHaveScreenshot(expected)
  258 |       fullPage: true,
  259 |       animations: 'disabled',
  260 |     });
  261 |   });
  262 | });
  263 |
```