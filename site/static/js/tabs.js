/**
 * Tabs Component for Feature Pages
 * 
 * This script handles the tabbed interface for feature details, ensuring
 * proper accessibility and keyboard navigation.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get all tab components on the page
  const tabLists = document.querySelectorAll('[role="tablist"]');
  
  // Set up each tabbed interface
  tabLists.forEach(tabList => {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
    
    // Add click event to each tab
    tabs.forEach(tab => {
      tab.addEventListener('click', changeTabs);
      
      // Handle keyboard events for accessibility
      tab.addEventListener('keydown', handleTabKeydown);
    });
    
    // Set initial state with the first tab active
    if (tabs.length > 0 && !tabs[0].getAttribute('aria-selected')) {
      tabs[0].setAttribute('aria-selected', 'true');
      
      // Show the first panel and hide others
      tabPanels.forEach((panel, index) => {
        if (index === 0) {
          panel.hidden = false;
        } else {
          panel.hidden = true;
        }
      });
    }
  });
  
  /**
   * Change tabs when a tab is clicked
   */
  function changeTabs(e) {
    const target = e.currentTarget;
    const parent = target.parentNode;
    const grandparent = parent.parentNode;
    
    // Get all tabs in this tablist
    const tabs = parent.querySelectorAll('[role="tab"]');
    
    // Hide all tabpanels
    const tabContainer = grandparent.parentNode;
    const tabPanels = tabContainer.querySelectorAll('[role="tabpanel"]');
    
    tabPanels.forEach(panel => {
      panel.hidden = true;
    });
    
    // Set all tabs as unselected
    tabs.forEach(tab => {
      tab.setAttribute('aria-selected', 'false');
    });
    
    // Set clicked tab as selected
    target.setAttribute('aria-selected', 'true');
    
    // Show the associated tabpanel
    const tabpanelID = target.getAttribute('aria-controls');
    const tabPanel = document.getElementById(tabpanelID);
    
    if (tabPanel) {
      tabPanel.hidden = false;
      
      // Announce tab change to screen readers
      const announcer = document.getElementById('tab-change-announcer');
      if (!announcer) {
        const newAnnouncer = document.createElement('div');
        newAnnouncer.id = 'tab-change-announcer';
        newAnnouncer.setAttribute('aria-live', 'polite');
        newAnnouncer.setAttribute('class', 'visually-hidden');
        document.body.appendChild(newAnnouncer);
      }
      
      const tabName = target.textContent.trim();
      document.getElementById('tab-change-announcer').textContent = `${tabName} tab selected`;
    }
  }
  
  /**
   * Handle keyboard navigation for tabs
   */
  function handleTabKeydown(e) {
    const target = e.currentTarget;
    const parent = target.parentNode;
    const tabs = Array.from(parent.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(target);
    
    // Define which keys we're handling
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < tabs.length - 1) {
          focusTab(tabs[currentIndex + 1]);
        } else {
          focusTab(tabs[0]); // Wrap to first tab
        }
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          focusTab(tabs[currentIndex - 1]);
        } else {
          focusTab(tabs[tabs.length - 1]); // Wrap to last tab
        }
        break;
        
      case 'Home':
        e.preventDefault();
        focusTab(tabs[0]); // Go to first tab
        break;
        
      case 'End':
        e.preventDefault();
        focusTab(tabs[tabs.length - 1]); // Go to last tab
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        target.click(); // Activate the tab
        break;
    }
  }
  
  /**
   * Focus and click on a tab
   */
  function focusTab(tab) {
    tab.focus();
    // Optionally auto-select the tab when navigating with arrow keys
    // Uncomment the next line to enable auto-selection
    // tab.click();
  }
});