/**
 * Apply Sora Font to Divinci Text
 * This script finds all occurrences of "Divinci" in the document and applies the Sora font to them
 */

document.addEventListener('DOMContentLoaded', function() {
  // Find all text nodes in the document
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  
  // Collect all text nodes
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  // Process each text node
  textNodes.forEach(textNode => {
    const text = textNode.nodeValue;
    
    // Skip empty nodes or nodes that don't contain "Divinci"
    if (!text || !text.includes('Divinci')) {
      return;
    }
    
    // Create a span with the Sora font class
    const span = document.createElement('span');
    span.className = 'divinci-brand';
    
    // Replace the text node with the span
    const parent = textNode.parentNode;
    
    // Skip if parent is already a .divinci-brand
    if (parent.classList && parent.classList.contains('divinci-brand')) {
      return;
    }
    
    // Skip if parent is a script or style tag
    if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
      return;
    }
    
    // Replace "Divinci" with the styled version
    const parts = text.split(/(Divinci)/g);
    
    if (parts.length > 1) {
      const fragment = document.createDocumentFragment();
      
      parts.forEach(part => {
        if (part === 'Divinci') {
          const brandSpan = document.createElement('span');
          brandSpan.className = 'divinci-brand';
          brandSpan.textContent = part;
          fragment.appendChild(brandSpan);
        } else if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      
      parent.replaceChild(fragment, textNode);
    }
  });
});
