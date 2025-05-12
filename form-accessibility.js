// Form Accessibility Enhancements
document.addEventListener('DOMContentLoaded', function() {
  // Get form elements
  const form = document.getElementById('mc-embedded-subscribe-form');
  const emailInput = document.getElementById('mce-EMAIL');
  const submitButton = document.getElementById('mc-embedded-subscribe');
  const statusDiv = document.querySelector('.form-submission-status');
  
  if (!form || !emailInput) return;
  
  // Email validation function
  function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }
  
  // Show validation error
  function showValidationError() {
    emailInput.setAttribute('aria-invalid', 'true');
    const validationEl = document.getElementById('email-validation');
    if (validationEl) {
      validationEl.classList.remove('visually-hidden');
    }
    
    // Announce error for screen readers
    if (statusDiv) {
      statusDiv.textContent = "Error: Please enter a valid email address.";
      // Clear after screen readers have time to announce
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 5000);
    }
  }
  
  // Clear validation error
  function clearValidationError() {
    emailInput.setAttribute('aria-invalid', 'false');
    const validationEl = document.getElementById('email-validation');
    if (validationEl) {
      validationEl.classList.add('visually-hidden');
    }
  }
  
  // Input validation on blur
  emailInput.addEventListener('blur', function() {
    if (this.value && !validateEmail(this.value)) {
      showValidationError();
    } else {
      clearValidationError();
    }
  });
  
  // Clear error when user starts typing
  emailInput.addEventListener('input', function() {
    if (this.getAttribute('aria-invalid') === 'true') {
      clearValidationError();
    }
  });
  
  // Form submission handler
  form.addEventListener('submit', function(e) {
    // Validate email before submission
    if (!emailInput.value || !validateEmail(emailInput.value)) {
      e.preventDefault();
      showValidationError();
      emailInput.focus();
      return false;
    }
    
    // Show submission status for screen readers
    if (statusDiv) {
      statusDiv.textContent = "Submitting your subscription...";
    }
    
    // We don't prevent the form from submitting if email is valid
    return true;
  });
  
  // Make form labels more accessible by ensuring they respond to clicks
  const formLabels = document.querySelectorAll('label');
  formLabels.forEach(label => {
    label.addEventListener('click', function() {
      const forId = this.getAttribute('for');
      if (forId) {
        const input = document.getElementById(forId);
        if (input) {
          input.focus();
        }
      }
    });
  });
  
  // Ensure the submit button is always in the tab order
  if (submitButton) {
    submitButton.setAttribute('tabindex', '0');
  }
});