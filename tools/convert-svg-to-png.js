/**
 * SVG to PNG/JPG Converter Script
 * 
 * This script converts SVG files to PNG and JPG formats.
 * It uses the browser's canvas API to perform the conversion.
 * 
 * Usage:
 * 1. Create an HTML file that includes this script
 * 2. Open the HTML file in a browser
 * 3. The script will convert all SVG files in the specified directory
 */

// Configuration
const config = {
    // SVG files to convert (relative to the HTML file)
    svgFiles: [
        '../images/social/divinci-default-social.svg',
        '../images/social/about-us-social.svg',
        '../images/social/features-social.svg',
        '../images/social/team-social.svg',
        '../images/social/social-good-social.svg',
        '../images/social/blog-post-social.svg'
    ],
    // Output dimensions
    width: 1200,
    height: 630,
    // Output formats
    formats: ['png', 'jpg'],
    // Output quality for JPG (0-1)
    jpgQuality: 0.9
};

// Create a container for the output
const container = document.createElement('div');
container.style.padding = '20px';
container.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(container);

// Add a title
const title = document.createElement('h1');
title.textContent = 'SVG to PNG/JPG Converter';
title.style.color = '#16214c';
container.appendChild(title);

// Add a status element
const status = document.createElement('div');
status.style.padding = '10px';
status.style.marginBottom = '20px';
status.style.borderRadius = '4px';
container.appendChild(status);

// Function to show status
function showStatus(message, type) {
    status.textContent = message;
    status.style.backgroundColor = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#cce5ff';
    status.style.color = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#004085';
}

// Function to convert SVG to image
function convertSvgToImage(svgUrl, width, height, format) {
    return new Promise((resolve, reject) => {
        // Fetch SVG file
        fetch(svgUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch SVG: ${response.statusText}`);
                }
                return response.text();
            })
            .then(svgData => {
                // Create image from SVG data
                const img = new Image();
                img.onload = function() {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to requested format
                    let dataUrl;
                    if (format === 'jpg' || format === 'jpeg') {
                        dataUrl = canvas.toDataURL('image/jpeg', config.jpgQuality);
                    } else {
                        dataUrl = canvas.toDataURL('image/png');
                    }
                    
                    // Get filename from URL
                    const filename = svgUrl.split('/').pop().replace('.svg', '');
                    
                    resolve({
                        dataUrl: dataUrl,
                        format: format,
                        filename: filename
                    });
                };
                
                img.onerror = function() {
                    reject(new Error('Failed to load SVG'));
                };
                
                // Set source as data URL
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Function to create download link
function createDownloadLink(result) {
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = `${result.filename}.${result.format}`;
    link.textContent = `Download ${result.filename}.${result.format}`;
    link.style.display = 'block';
    link.style.marginBottom = '10px';
    link.style.color = '#16214c';
    return link;
}

// Function to create preview
function createPreview(result) {
    const previewContainer = document.createElement('div');
    previewContainer.style.marginBottom = '30px';
    previewContainer.style.padding = '10px';
    previewContainer.style.backgroundColor = '#f8f9fa';
    previewContainer.style.borderRadius = '4px';
    
    const heading = document.createElement('h3');
    heading.textContent = result.filename;
    heading.style.color = '#16214c';
    previewContainer.appendChild(heading);
    
    const img = document.createElement('img');
    img.src = result.dataUrl;
    img.alt = result.filename;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.marginBottom = '10px';
    img.style.border = '1px solid #ddd';
    previewContainer.appendChild(img);
    
    const downloadContainer = document.createElement('div');
    downloadContainer.style.marginTop = '10px';
    previewContainer.appendChild(downloadContainer);
    
    return { previewContainer, downloadContainer };
}

// Main function to convert all SVG files
async function convertAllSvgFiles() {
    showStatus('Converting SVG files...', 'info');
    
    const results = {};
    
    try {
        // Process each SVG file
        for (const svgUrl of config.svgFiles) {
            const filename = svgUrl.split('/').pop().replace('.svg', '');
            results[filename] = { previews: {} };
            
            // Create preview container
            const { previewContainer, downloadContainer } = createPreview({ 
                filename: filename, 
                dataUrl: 'placeholder' 
            });
            container.appendChild(previewContainer);
            results[filename].previewContainer = previewContainer;
            results[filename].downloadContainer = downloadContainer;
            
            // Convert to each format
            for (const format of config.formats) {
                try {
                    const result = await convertSvgToImage(svgUrl, config.width, config.height, format);
                    
                    // Store result
                    results[filename].previews[format] = result;
                    
                    // Create download link
                    const link = createDownloadLink(result);
                    downloadContainer.appendChild(link);
                    
                    // Update preview image (use PNG for preview)
                    if (format === 'png') {
                        const img = previewContainer.querySelector('img');
                        img.src = result.dataUrl;
                    }
                } catch (error) {
                    console.error(`Error converting ${filename} to ${format}:`, error);
                    showStatus(`Error converting ${filename} to ${format}: ${error.message}`, 'error');
                }
            }
        }
        
        showStatus(`Successfully converted ${Object.keys(results).length} SVG files!`, 'success');
    } catch (error) {
        console.error('Error in conversion process:', error);
        showStatus(`Error in conversion process: ${error.message}`, 'error');
    }
}

// Start conversion when the page loads
window.addEventListener('DOMContentLoaded', convertAllSvgFiles);
