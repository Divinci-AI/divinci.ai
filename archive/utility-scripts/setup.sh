#!/bin/bash

# Update system packages
sudo apt-get update

# Install Node.js 18.x (LTS) for development tooling
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js and npm installation
node --version
npm --version

# Install dependencies for development and testing
npm install

# Install Playwright browsers for testing
npx playwright install

# Install additional system dependencies for Playwright
npx playwright install-deps

# Add npm global bin to PATH if not already present
if ! echo $PATH | grep -q "/usr/local/bin"; then
    echo 'export PATH="/usr/local/bin:$PATH"' | sudo tee -a /etc/profile
fi

# Add node_modules/.bin to PATH for local packages
echo 'export PATH="./node_modules/.bin:$PATH"' | sudo tee -a /etc/profile

# Source the profile to update current session
source /etc/profile

# Create test-results directory if it doesn't exist
mkdir -p test-results

# Set proper permissions
chmod -R 755 node_modules/.bin/ 2>/dev/null || true

# Start the web server in the background for tests using npx
# The tests expect the server to be running on port 61443 based on the config
npx http-server . -p 61443 --silent &

# Wait a moment for the server to start
sleep 3

# Verify server is running
if curl -s http://localhost:61443 > /dev/null; then
    echo "Web server started successfully on port 61443"
else
    echo "Failed to start web server"
    exit 1
fi

# Verify the static website structure
if [ -f "index.html" ]; then
    echo "Main index.html found"
else
    echo "Warning: index.html not found in root directory"
fi

# Check for language directories
for lang in ar es fr; do
    if [ -d "$lang" ] && [ -f "$lang/index.html" ]; then
        echo "Language directory $lang/ with index.html found"
    else
        echo "Warning: Language directory $lang/ or $lang/index.html not found"
    fi
done

# Check for includes directory
if [ -d "includes" ]; then
    echo "Includes directory found"
else
    echo "Warning: includes/ directory not found"
fi

# Check for optimized assets
if [ -d "optimized" ]; then
    echo "Optimized assets directory found"
else
    echo "Warning: optimized/ directory not found"
fi

# Check for JavaScript files that handle includes
if [ -f "js/debug-include.js" ] || [ -f "debug-include.js" ]; then
    echo "Include handler JavaScript found"
else
    echo "Warning: Include handler JavaScript not found"
fi

echo "Static website setup completed successfully!"