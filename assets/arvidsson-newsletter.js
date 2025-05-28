/**
 * Arvidsson Newsletter Module JavaScript
 * Handles form validation, submission, and user feedback
 */

class ArvidssomNewsletter {
  constructor() {
    this.forms = document.querySelectorAll('[data-newsletter-form]');
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    this.errorMessages = {
      required: 'E-postadress krävs',
      invalid: 'Ange en giltig e-postadress',
      duplicate: 'Du är redan registrerad för vårt nyhetsbrev',
      server: 'Ett fel uppstod. Försök igen senare',
      network: 'Nätverksfel. Kontrollera din internetanslutning'
    };
    
    this.init();
  }
  
  init() {
    this.forms.forEach(form => this.initializeForm(form));
  }
  
  initializeForm(form) {
    const sectionId = form.id.split('-').pop();
    const emailInput = form.querySelector(`#newsletter-email-${sectionId}`);
    const submitButton = form.querySelector('.arvidsson-newsletter__submit');
    const errorElement = form.querySelector(`#newsletter-error-${sectionId}`);
    const successElement = form.querySelector(`#newsletter-success-${sectionId}`);
    
    if (!emailInput || !submitButton || !errorElement || !successElement) {
      console.warn('Newsletter form elements not found');
      return;
    }
    
    // Store references for this form
    const formData = {
      form,
      emailInput,
      submitButton,
      errorElement,
      successElement,
      sectionId
    };
    
    // Bind events
    this.bindFormEvents(formData);
    
    // Check for existing subscription on load
    this.checkExistingSubscription(formData);
  }
  
  bindFormEvents(formData) {
    const { form, emailInput, submitButton } = formData;
    
    // Form submission
    form.addEventListener('submit', (e) => this.handleSubmit(e, formData));
    
    // Real-time validation
    emailInput.addEventListener('input', () => this.validateEmail(formData));
    emailInput.addEventListener('blur', () => this.validateEmail(formData));
    
    // Clear error on focus
    emailInput.addEventListener('focus', () => this.clearError(formData));
    
    // Keyboard shortcuts
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });
    
    // Prevent double submission
    submitButton.addEventListener('click', (e) => {
      if (submitButton.disabled || submitButton.classList.contains('loading')) {
        e.preventDefault();
      }
    });
  }
  
  async handleSubmit(e, formData) {
    e.preventDefault();
    
    const { form, emailInput, submitButton } = formData;
    const email = emailInput.value.trim();
    
    // Validate email
    if (!this.validateEmail(formData)) {
      emailInput.focus();
      return;
    }
    
    // Check if already submitting
    if (submitButton.disabled || submitButton.classList.contains('loading')) {
      return;
    }
    
    try {
      this.setLoadingState(formData, true);
      this.clearError(formData);
      
      // Create form data
      const formData_obj = new FormData(form);
      
      // Submit to Shopify
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData_obj,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        // Handle success
        await this.handleSuccess(formData, email);
        
        // Track newsletter signup
        this.trackSignup(email, formData.sectionId);
        
      } else {
        // Handle server errors
        const errorText = await response.text();
        this.handleError(formData, this.parseServerError(errorText));
      }
      
    } catch (error) {
      console.error('Newsletter submission error:', error);
      this.handleError(formData, this.errorMessages.network);
    } finally {
      this.setLoadingState(formData, false);
    }
  }
  
  validateEmail(formData) {
    const { emailInput } = formData;
    const email = emailInput.value.trim();
    
    if (!email) {
      this.showError(formData, this.errorMessages.required);
      return false;
    }
    
    if (!this.emailRegex.test(email)) {
      this.showError(formData, this.errorMessages.invalid);
      return false;
    }
    
    this.clearError(formData);
    return true;
  }
  
  async handleSuccess(formData, email) {
    const { form, successElement } = formData;
    
    // Hide form and show success message
    form.style.display = 'none';
    successElement.style.display = 'flex';
    successElement.classList.add('show');
    
    // Store successful subscription
    this.storeSubscription(email);
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('newsletter:subscribed', {
      detail: { email, sectionId: formData.sectionId }
    }));
    
    // Optional: Auto-hide success message after delay
    setTimeout(() => {
      this.resetForm(formData);
    }, 10000);
  }
  
  handleError(formData, errorMessage) {
    this.showError(formData, errorMessage);
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('newsletter:error', {
      detail: { error: errorMessage, sectionId: formData.sectionId }
    }));
  }
  
  showError(formData, message) {
    const { errorElement } = formData;
    const errorText = errorElement.querySelector('.arvidsson-newsletter__error-text');
    
    if (errorText) {
      errorText.textContent = message;
    }
    
    errorElement.style.display = 'flex';
    errorElement.classList.add('show');
    
    // Announce error to screen readers
    errorElement.setAttribute('aria-live', 'polite');
  }
  
  clearError(formData) {
    const { errorElement } = formData;
    
    errorElement.style.display = 'none';
    errorElement.classList.remove('show');
    errorElement.removeAttribute('aria-live');
  }
  
  setLoadingState(formData, isLoading) {
    const { submitButton, emailInput } = formData;
    
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.classList.add('loading');
      emailInput.disabled = true;
    } else {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
      emailInput.disabled = false;
    }
  }
  
  resetForm(formData) {
    const { form, successElement, emailInput } = formData;
    
    successElement.style.display = 'none';
    successElement.classList.remove('show');
    form.style.display = 'block';
    emailInput.value = '';
    this.clearError(formData);
  }
  
  parseServerError(errorText) {
    // Parse Shopify error responses
    if (errorText.includes('already exists') || errorText.includes('redan registrerad')) {
      return this.errorMessages.duplicate;
    }
    
    if (errorText.includes('email') || errorText.includes('e-post')) {
      return this.errorMessages.invalid;
    }
    
    return this.errorMessages.server;
  }
  
  storeSubscription(email) {
    try {
      const subscriptions = JSON.parse(localStorage.getItem('arvidsson-newsletter-subscriptions') || '[]');
      if (!subscriptions.includes(email)) {
        subscriptions.push(email);
        localStorage.setItem('arvidsson-newsletter-subscriptions', JSON.stringify(subscriptions));
      }
    } catch (error) {
      console.warn('Could not store subscription:', error);
    }
  }
  
  checkExistingSubscription(formData) {
    try {
      const subscriptions = JSON.parse(localStorage.getItem('arvidsson-newsletter-subscriptions') || '[]');
      const { emailInput } = formData;
      
      // Pre-fill if user has subscribed before (optional)
      if (subscriptions.length > 0 && !emailInput.value) {
        // Don't auto-fill, just check for validation purposes
        // emailInput.value = subscriptions[subscriptions.length - 1];
      }
    } catch (error) {
      console.warn('Could not check existing subscriptions:', error);
    }
  }
  
  trackSignup(email, sectionId) {
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'newsletter_signup', {
        event_category: 'engagement',
        event_label: sectionId,
        custom_parameter_1: email.split('@')[1] // Domain only for privacy
      });
    }
    
    // Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Subscribe', {
        content_name: 'Newsletter',
        content_category: 'Email Marketing'
      });
    }
    
    // Shopify Analytics
    if (typeof ShopifyAnalytics !== 'undefined') {
      ShopifyAnalytics.lib.track('Newsletter Subscription', {
        section: sectionId,
        domain: email.split('@')[1]
      });
    }
  }
  
  // Public methods
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  static getSubscriptions() {
    try {
      return JSON.parse(localStorage.getItem('arvidsson-newsletter-subscriptions') || '[]');
    } catch {
      return [];
    }
  }
  
  static clearSubscriptions() {
    localStorage.removeItem('arvidsson-newsletter-subscriptions');
  }
}

/**
 * Enhanced Newsletter Form with Advanced Features
 */
class ArvidssomNewsletterPro extends ArvidssomNewsletter {
  constructor() {
    super();
    this.initAdvancedFeatures();
  }
  
  initAdvancedFeatures() {
    this.setupEmailDomainSuggestions();
    this.setupDoubleOptIn();
    this.setupPreferences();
  }
  
  setupEmailDomainSuggestions() {
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    
    this.forms.forEach(form => {
      const emailInput = form.querySelector('input[type="email"]');
      if (!emailInput) return;
      
      const suggestionElement = this.createSuggestionElement();
      emailInput.parentNode.appendChild(suggestionElement);
      
      emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        const suggestion = this.getSuggestion(email, commonDomains);
        
        if (suggestion) {
          this.showSuggestion(suggestionElement, suggestion, emailInput);
        } else {
          this.hideSuggestion(suggestionElement);
        }
      });
    });
  }
  
  createSuggestionElement() {
    const suggestion = document.createElement('div');
    suggestion.className = 'arvidsson-newsletter__suggestion';
    suggestion.style.display = 'none';
    suggestion.innerHTML = `
      <span class="arvidsson-newsletter__suggestion-text">Menade du: </span>
      <button type="button" class="arvidsson-newsletter__suggestion-link"></button>
    `;
    return suggestion;
  }
  
  getSuggestion(email, domains) {
    if (!email.includes('@')) return null;
    
    const [localPart, domain] = email.split('@');
    const suggestion = this.findClosestDomain(domain, domains);
    
    if (suggestion && suggestion !== domain) {
      return `${localPart}@${suggestion}`;
    }
    
    return null;
  }
  
  findClosestDomain(domain, domains) {
    let minDistance = Infinity;
    let closestDomain = null;
    
    domains.forEach(d => {
      const distance = this.levenshteinDistance(domain.toLowerCase(), d.toLowerCase());
      if (distance < minDistance && distance <= 2) {
        minDistance = distance;
        closestDomain = d;
      }
    });
    
    return closestDomain;
  }
  
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  showSuggestion(suggestionElement, suggestion, emailInput) {
    const suggestionLink = suggestionElement.querySelector('.arvidsson-newsletter__suggestion-link');
    suggestionLink.textContent = suggestion;
    suggestionElement.style.display = 'block';
    
    suggestionLink.onclick = () => {
      emailInput.value = suggestion;
      emailInput.focus();
      this.hideSuggestion(suggestionElement);
    };
  }
  
  hideSuggestion(suggestionElement) {
    suggestionElement.style.display = 'none';
  }
  
  setupDoubleOptIn() {
    // Implementation for double opt-in process
    document.addEventListener('newsletter:subscribed', (e) => {
      const { email } = e.detail;
      
      // Show confirmation message
      this.showConfirmationMessage(email);
      
      // Send confirmation email (would be handled server-side)
      this.requestConfirmationEmail(email);
    });
  }
  
  showConfirmationMessage(email) {
    const notification = document.createElement('div');
    notification.className = 'arvidsson-newsletter-notification';
    notification.innerHTML = `
      <div class="arvidsson-newsletter-notification__content">
        <h4>Bekräfta din prenumeration</h4>
        <p>Vi har skickat en bekräftelselänk till ${email}. Klicka på länken för att aktivera din prenumeration.</p>
        <button class="arvidsson-newsletter-notification__close">Stäng</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      notification.remove();
    }, 8000);
    
    // Close button
    notification.querySelector('.arvidsson-newsletter-notification__close').onclick = () => {
      notification.remove();
    };
  }
  
  async requestConfirmationEmail(email) {
    try {
      await fetch('/apps/newsletter/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email })
      });
    } catch (error) {
      console.warn('Could not send confirmation email:', error);
    }
  }
  
  setupPreferences() {
    // Add preference checkboxes for different newsletter types
    this.forms.forEach(form => {
      const preferencesHTML = `
        <div class="arvidsson-newsletter__preferences" style="margin-top: 16px;">
          <p style="font-size: 14px; margin-bottom: 8px;">Vad vill du få information om?</p>
          <label class="arvidsson-newsletter__preference">
            <input type="checkbox" name="preferences[]" value="new-arrivals" checked>
            <span>Nyheter & kollektioner</span>
          </label>
          <label class="arvidsson-newsletter__preference">
            <input type="checkbox" name="preferences[]" value="sales">
            <span>Erbjudanden & rea</span>
          </label>
          <label class="arvidsson-newsletter__preference">
            <input type="checkbox" name="preferences[]" value="inspiration">
            <span>Inredningsinspiration</span>
          </label>
        </div>
      `;
      
      const privacyText = form.querySelector('.arvidsson-newsletter__privacy');
      if (privacyText) {
        privacyText.insertAdjacentHTML('beforebegin', preferencesHTML);
      }
    });
  }
}

// Initialize newsletter functionality
document.addEventListener('DOMContentLoaded', () => {
  // Use Pro version if available, otherwise use basic version
  if (document.querySelectorAll('[data-newsletter-form]').length > 0) {
    window.arvidssomNewsletter = new ArvidssomNewsletter();
  }
});

// CSS for additional features (injected dynamically)
const additionalStyles = `
  .arvidsson-newsletter__suggestion {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    font-size: 14px;
    color: #0369a1;
  }
  
  .arvidsson-newsletter__suggestion-link {
    background: none;
    border: none;
    color: #0369a1;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 600;
  }
  
  .arvidsson-newsletter__preferences {
    text-align: left;
  }
  
  .arvidsson-newsletter__preference {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .arvidsson-newsletter__preference input {
    margin: 0;
  }
  
  .arvidsson-newsletter-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    max-width: 400px;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  }
  
  .arvidsson-newsletter-notification__content {
    padding: 20px;
  }
  
  .arvidsson-newsletter-notification__content h4 {
    margin: 0 0 8px 0;
    color: #1f2937;
  }
  
  .arvidsson-newsletter-notification__content p {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
  }
  
  .arvidsson-newsletter-notification__close {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .arvidsson-newsletter-notification__close:hover {
    background: #e5e7eb;
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Inject additional styles
if (!document.getElementById('arvidsson-newsletter-additional-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'arvidsson-newsletter-additional-styles';
  styleSheet.textContent = additionalStyles;
  document.head.appendChild(styleSheet);
}
