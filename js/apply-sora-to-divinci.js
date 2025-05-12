/**
 * Apply Sora font to all instances of "Divinci" in text nodes
 */
document.addEventListener('DOMContentLoaded', function() {
    // Function to wrap Divinci occurrences with span
    function wrapDivinciWithSpan(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text.includes('Divinci')) {
                const newHtml = text.replace(/(Divinci\S*)/g, '<span class="divinci-brand">$1</span>');
                const tempElement = document.createElement('span');
                tempElement.innerHTML = newHtml;
                
                // Replace the text node with the new elements
                const parent = node.parentNode;
                const nextSibling = node.nextSibling;
                
                // Skip replacement for nodes that are already in Sora
                if (isNodeAlreadyInSora(parent)) {
                    return;
                }
                
                Array.from(tempElement.childNodes).forEach(child => {
                    parent.insertBefore(child, nextSibling);
                });
                
                parent.removeChild(node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Skip script and style elements, and elements already with divinci-brand
            if (node.nodeName === 'SCRIPT' || 
                node.nodeName === 'STYLE' || 
                node.classList.contains('divinci-brand') ||
                node.classList.contains('brand-name')) {
                return;
            }
            
            // Process child nodes
            Array.from(node.childNodes).forEach(wrapDivinciWithSpan);
        }
    }
    
    // Check if a node already has Sora applied
    function isNodeAlreadyInSora(node) {
        if (!node || !node.style) return false;
        
        const computedStyle = window.getComputedStyle(node);
        const fontFamily = computedStyle.getPropertyValue('font-family');
        
        return fontFamily.includes('Sora') || 
               node.classList.contains('brand-name') || 
               node.classList.contains('nav-title') ||
               node.tagName === 'H1' || 
               node.tagName === 'H2' || 
               node.tagName === 'H3' || 
               node.tagName === 'H4' || 
               node.tagName === 'H5' || 
               node.tagName === 'H6';
    }
    
    // Start processing from the body
    wrapDivinciWithSpan(document.body);
    
    // Set document title font to Sora
    if (document.title.includes('Divinci')) {
        // We can't change the font of the title element directly,
        // but we've ensured our font styles are loaded before any page content
    }
});