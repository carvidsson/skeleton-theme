/**
 * Arvidsson Footer Module JavaScript
 * Handles back to top, newsletter signup, and footer interactions
 */

class ArvidssomFooter {
  constructor() {
    this.footer = document.getElementById('footer');
    this.backToTopBtn = document.getElementById('back-to-top');
    this.newsletterForm = this.footer?.querySelector('.arvidsson-footer__newsletter-form');
    this.socialLinks = this.footer?.querySelectorAll('.arvidsson-footer__social-link');
    
    if (!this.footer) return;
    
    this.init();
  }
  
  init() {
    this.setupBackToTop();
    this.setupNewsletterForm();
    this.setupSocialTracking();
    this.observeFooter();
  }
  
  setupBackToTop() {
    if (!this.backToTopBtn) return;
    
    // Show/hide back to top button based on scroll position
    let ticking = false;
    
    const updateBackToTop = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const shouldShow = scrollTop > 500;
      
      if (shouldShow) {
        this.backToTopBtn.classList.add('show');
        this.backToTopBtn.style.display = 'flex';
      } else {
        this.backToTopBtn.classList.remove('show');
      }
      
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateBackToTop);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', requestTick, { passive: true });
    
    // Handle click
    this.backToTopBtn.addEventListener('click', () => {
      this.scrollToTop();
    });
    
    // Keyboard support
    this.backToTopBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.scrollToTop();
      }
    });
  }
  
  scrollToTop() {
    const startPosition = window.pageYOffset;
    const duration = 800;
    const startTime = performance.now();
    
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition * (1 - ease));
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
    
    // Focus management for accessibility
    setTimeout(() => {
      const header = document.getElementById('header');
      if (header) {
        header.focus();
      }
    }, duration);
  }
  
  setupNewsletterForm() {
    if (!this.newsletterForm) return;
    
    const emailInput = this.newsletterForm.querySelector('.arvidsson-footer__newsletter-input');
    const submitBtn = this.newsletterForm.querySelector('.arvidsson-footer__newsletter-btn');
    
    if (!emailInput || !submitBtn) return;
    
    // Form validation
    emailInput.addEventListener('input', () => {
      this.validateNewsletterEmail(emailInput);
    });
    
    // Form submission
    this.newsletterForm.addEventListener('submit', (e) => {
      this.handleNewsletterSubmit(e, emailInput, submitBtn);
    });
    
    // Enhanced UX
    emailInput.addEventListener('focus', () => {
      this.newsletterForm.classList.add('is-focused');
    });
    
    emailInput.addEventListener('blur', () => {
      this.newsletterForm.classList.remove('is-focused');
    });
  }
  
  validateNewsletterEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
      input.setCustomValidity('Ange en giltig e-postadress');
      return false;
    } else {
      input.setCustomValidity('');
      return true;
    }
  }
  
  async handleNewsletterSubmit(e, emailInput, submitBtn) {
    e.preventDefault();
    
    if (!this.validateNewsletterEmail(emailInput)) {
      emailInput.focus();
      return;
    }
    
    const email = emailInput.value.trim();
    const originalBtnContent = submitBtn.innerHTML;
    
    try {
      // Set loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
          <path d="M2 12a10 10 0 0 1 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
      
      // Submit form
      const formData = new FormData(this.newsletterForm);
      const response = await fetch(this.newsletterForm.action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        // Success
        this.showNewsletterSuccess(email);
        emailInput.value = '';
        
        // Track signup
        this.trackNewsletterSignup(email);
        
      } else {
        throw new Error('Subscription failed');
      }
      
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      this.showNewsletterError();
    } finally {
      // Restore button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  }
  
  showNewsletterSuccess(email) {
    const message = this.createNotification(
      'Tack för din prenumeration! Välkommen till Arvidsson-familjen.',
      'success'
    );
    
    this.showNotification(message);
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('newsletter:subscribed', {
      detail: { email, source: 'footer' }
    }));
  }
  
  showNewsletterError() {
    const message = this.createNotification(
      'Något gick fel. Försök igen senare.',
      'error'
    );
    
    this.showNotification(message);
  }
  
  createNotification(text, type) {
    const notification = document.createElement('div');
    notification.className = `arvidsson-footer-notification arvidsson-footer-notification--${type}`;
    
    const icon = type === 'success' 
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><polyline points="16,10 10,16 8,14" stroke="currentColor" stroke-width="2"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/></svg>';
    
    notification.innerHTML = `
      <div class="arvidsson-footer-notification__content">
        ${icon}
        <span>${text}</span>
        <button class="arvidsson-footer-notification__close" aria-label="Stäng">×</button>
      </div>
    `;
    
    return notification;
  }
  
  showNotification(notification) {
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
      this.removeNotification(notification);
    }, 5000);
    
    // Close button
    const closeBtn = notification.querySelector('.arvidsson-footer-notification__close');
    closeBtn.addEventListener('click', () => {
      this.removeNotification(notification);
    });
  }
  
  removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }
  
  setupSocialTracking() {
    if (!this.socialLinks) return;
    
    this.socialLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const platform = this.getSocialPlatform(link.href);
        this.trackSocialClick(platform, link.href);
      });
    });
  }
  
  getSocialPlatform(url) {
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
    if (url.includes('pinterest.com')) return 'Pinterest';
    if (url.includes('youtube.com')) return 'YouTube';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    return 'Unknown';
  }
  
  trackSocialClick(platform, url) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'social_click', {
        event_category: 'Social Media',
        event_label: platform,
        social_network: platform.toLowerCase(),
        social_action: 'click',
        social_target: url
      });
    }
    
    // Custom event
    document.dispatchEvent(new CustomEvent('social:clicked', {
      detail: { platform, url, source: 'footer' }
    }));
  }
  
  trackNewsletterSignup(email) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'newsletter_signup', {
        event_category: 'Email Marketing',
        event_label: 'Footer Newsletter',
        custom_parameter_1: email.split('@')[1] // Domain only for privacy
      });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Subscribe', {
        content_name: 'Newsletter',
        content_category: 'Email Marketing',
        value: 1,
        currency: 'SEK'
      });
    }
  }
  
  observeFooter() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Footer is visible
          document.body.classList.add('footer-visible');
          
          // Track footer view
          this.trackFooterView();
          
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });
    
    observer.observe(this.footer);
  }
  
  trackFooterView() {
    // Track that user scrolled to footer (engagement metric)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'footer_view', {
        event_category: 'Engagement',
        event_label: 'Footer Reached'
      });
    }
  }
  
  // Public methods
  showBackToTop() {
    if (this.backToTopBtn) {
      this.backToTopBtn.classList.add('show');
      this.backToTopBtn.style.display = 'flex';
    }
  }
  
  hideBackToTop() {
    if (this.backToTopBtn) {
      this.backToTopBtn.classList.remove('show');
    }
  }
  
  static scrollToTop() {
    const instance = window.arvidssomFooter;
    if (instance) {
      instance.scrollToTop();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomFooter = new ArvidssomFooter();
});

// CSS for notifications (injected dynamically)
const footerNotificationStyles = `
  .arvidsson-footer-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 400px;
    transform: translateY(100%);
    opacity: 0;
    transition: all 0.3s ease-out;
  }
  
  .arvidsson-footer-notification.show {
    transform: translateY(0);
    opacity: 1;
  }
  
  .arvidsson-footer-notification--success {
    border-left: 4px solid #22c55e;
  }
  
  .arvidsson-footer-notification--error {
    border-left: 4px solid #ef4444;
  }
  
  .arvidsson-footer-notification__content {
    display: flex;
    align-items: center;
    padding: 16px;
    gap: 12px;
  }
  
  .arvidsson-footer-notification--success .arvidsson-footer-notification__content svg {
    color: #22c55e;
  }
  
  .arvidsson-footer-notification--error .arvidsson-footer-notification__content svg {
    color: #ef4444;
  }
  
  .arvidsson-footer-notification__content span {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    color: #374151;
  }
  
  .arvidsson-footer-notification__close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    font-size: 18px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
    flex-shrink: 0;
  }
  
  .arvidsson-footer-notification__close:hover {
    background-color: #f3f4f6;
  }
  
  /* Form focus styles */
  .arvidsson-footer__newsletter-form.is-focused .arvidsson-footer__newsletter-input-group {
    box-shadow: 0 0 0 2px var(--color-primary);
  }
  
  /* Enhanced responsive styles */
  @media (max-width: 767px) {
    .arvidsson-footer-notification {
      bottom: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
`;

// Inject styles if not already present
if (!document.getElementById('arvidsson-footer-notification-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'arvidsson-footer-notification-styles';
  styleSheet.textContent = footerNotificationStyles;
  document.head.appendChild(styleSheet);
}