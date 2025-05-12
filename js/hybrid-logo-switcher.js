/**
 * Hybrid Logo Font Switcher
 * Allows dynamic testing of different hybrid fonts for the Divinci logo
 * Combines modern SaaS aesthetics with cultural sophistication
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if the logo font option has been applied previously
    const currentFont = localStorage.getItem('divinci-hybrid-font') || 'outfit';

    // Apply the saved font option on page load
    applyHybridLogoFont(currentFont);

    // Add font switcher if it doesn't exist already
    if (!document.getElementById('hybrid-font-switcher')) {
        createHybridFontSwitcher();
    }
});

/**
 * Creates a font switcher UI in the bottom right of the page
 */
function createHybridFontSwitcher() {
    // Create the font switcher container
    const switcher = document.createElement('div');
    switcher.id = 'hybrid-font-switcher';
    switcher.style.position = 'fixed';
    switcher.style.bottom = '20px';
    switcher.style.right = '20px';
    switcher.style.backgroundColor = 'rgba(13, 16, 45, 0.8)';
    switcher.style.padding = '15px';
    switcher.style.borderRadius = '8px';
    switcher.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    switcher.style.zIndex = '9999';
    switcher.style.fontFamily = 'Inter, sans-serif';
    switcher.style.border = '1px solid rgba(92, 226, 231, 0.4)';
    switcher.style.maxWidth = '250px';
    switcher.style.transition = 'transform 0.3s ease';
    switcher.style.transform = 'translateX(80%)';

    // Add hover functionality to show the full panel
    switcher.addEventListener('mouseenter', () => {
        switcher.style.transform = 'translateX(0)';
    });
    
    switcher.addEventListener('mouseleave', () => {
        switcher.style.transform = 'translateX(80%)';
    });

    // Add heading
    const heading = document.createElement('h3');
    heading.textContent = 'Hybrid Logo Fonts';
    heading.style.color = '#5ce2e7';
    heading.style.margin = '0 0 10px 0';
    heading.style.fontSize = '14px';
    heading.style.fontWeight = '600';
    
    // Create the font options list
    const optionsList = document.createElement('div');
    optionsList.style.display = 'flex';
    optionsList.style.flexDirection = 'column';
    optionsList.style.gap = '8px';
    
    // Define font options
    const fontOptions = [
        { id: 'outfit', name: 'Outfit (Default)', fontClass: '' },
        { id: 'cabin', name: 'Cabin', fontClass: 'logo-font-cabin' },
        { id: 'spectral', name: 'Spectral', fontClass: 'logo-font-spectral' },
        { id: 'manrope', name: 'Manrope', fontClass: 'logo-font-manrope' },
        { id: 'sora', name: 'Sora', fontClass: 'logo-font-sora' },
        { id: 'dm-serif', name: 'DM Serif Display', fontClass: 'logo-font-dm-serif' },
        { id: 'commissioner', name: 'Commissioner', fontClass: 'logo-font-commissioner' },
        { id: 'petrona', name: 'Petrona', fontClass: 'logo-font-petrona' }
    ];
    
    // Create a radio button for each font option
    fontOptions.forEach(option => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';
        label.style.cursor = 'pointer';
        label.style.color = '#fff';
        label.style.fontSize = '12px';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'hybrid-logo-font';
        radio.value = option.id;
        radio.checked = (localStorage.getItem('divinci-hybrid-font') || 'outfit') === option.id;
        radio.style.margin = '0';
        
        // Add event listener to change the font
        radio.addEventListener('change', () => {
            if (radio.checked) {
                applyHybridLogoFont(option.id);
                localStorage.setItem('divinci-hybrid-font', option.id);
            }
        });
        
        const text = document.createTextNode(option.name);
        
        label.appendChild(radio);
        label.appendChild(text);
        optionsList.appendChild(label);
    });
    
    // Add a link to the font demo page
    const demoLink = document.createElement('a');
    demoLink.href = 'hybrid-logo-fonts.html';
    demoLink.textContent = 'View All Hybrid Font Options';
    demoLink.style.marginTop = '12px';
    demoLink.style.fontSize = '12px';
    demoLink.style.color = '#5ce2e7';
    demoLink.style.textDecoration = 'none';
    demoLink.style.display = 'inline-block';
    
    demoLink.addEventListener('mouseenter', () => {
        demoLink.style.textDecoration = 'underline';
    });
    
    demoLink.addEventListener('mouseleave', () => {
        demoLink.style.textDecoration = 'none';
    });
    
    // Assemble the switcher
    switcher.appendChild(heading);
    switcher.appendChild(optionsList);
    switcher.appendChild(demoLink);
    
    // Add the switcher to the page
    document.body.appendChild(switcher);
}

/**
 * Applies the selected hybrid logo font to all relevant elements
 * @param {string} fontId - The ID of the font to apply
 */
function applyHybridLogoFont(fontId) {
    // Get the brand name elements
    const brandNames = document.querySelectorAll('.brand-name, .nav-title');
    
    // Remove any existing font classes
    const fontClasses = [
        'logo-font-cabin',
        'logo-font-spectral',
        'logo-font-manrope',
        'logo-font-sora',
        'logo-font-dm-serif',
        'logo-font-commissioner',
        'logo-font-petrona',
        'hybrid-logo-text',
        'hybrid-gradient',
        'hybrid-accent',
        'hybrid-modern',
        'hybrid-hover',
        'hybrid-animate'
    ];
    
    brandNames.forEach(element => {
        fontClasses.forEach(className => {
            element.classList.remove(className);
        });
    });
    
    // Apply the selected font class
    let fontClass = '';
    let effectClass = '';
    
    switch (fontId) {
        case 'cabin':
            fontClass = 'logo-font-cabin';
            effectClass = 'hybrid-logo-text';
            break;
        case 'spectral':
            fontClass = 'logo-font-spectral';
            effectClass = 'hybrid-logo-text';
            break;
        case 'manrope':
            fontClass = 'logo-font-manrope';
            effectClass = 'hybrid-gradient';
            break;
        case 'sora':
            fontClass = 'logo-font-sora';
            effectClass = 'hybrid-modern';
            break;
        case 'dm-serif':
            fontClass = 'logo-font-dm-serif';
            effectClass = 'hybrid-accent';
            break;
        case 'commissioner':
            fontClass = 'logo-font-commissioner';
            effectClass = 'hybrid-logo-text';
            break;
        case 'petrona':
            fontClass = 'logo-font-petrona';
            effectClass = 'hybrid-accent';
            break;
        default:
            // Default to Outfit (no additional classes)
            break;
    }
    
    // Apply the classes if they exist
    if (fontClass) {
        brandNames.forEach(element => {
            element.classList.add(fontClass);
            
            if (effectClass) {
                element.classList.add(effectClass);
            }
        });
    }
}