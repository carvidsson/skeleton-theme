/**
 * Arvidsson Featured Products Module JavaScript
 * Handles interactive features like wishlist, quick view, and ratings
 */

class ArvidssomFeaturedProducts {
  constructor() {
    this.containers = document.querySelectorAll('[data-section-type="featured-products"]');
    this.wishlistItems = JSON.parse(localStorage.getItem('arvidsson-wishlist') || '[]');
    
    if (this.containers.length === 0) return;
    
    this.init();
  }
  
  init() {
    this.containers.forEach(container => {
      this.initializeContainer(container);
    });
    
    this.bindGlobalEvents();
  }
  
  initializeContainer(container) {
    // Initialize star ratings
    this.initializeStars(container);
    
    // Initialize wishlist buttons
    this.initializeWishlist(container);
    
    // Initialize quick view buttons
    this.initializeQuickView(container);
    
    // Update wishlist states
    this.updateWishlistStates(container);
    
    // Add intersection observer for animations
    this.observeContainer(container);
  }
  
  initializeStars(container) {
    const starsContainers = container.querySelectorAll('.arvidsson-featured-product__stars');
    
    starsContainers.forEach(starsContainer => {
      const rating = parseFloat(starsContainer.dataset.rating) || 0;
      const stars = starsContainer.querySelectorAll('.arvidsson-featured-product__star');
      
      stars.forEach((star, index) => {
        if (index < Math.floor(rating)) {
          star.classList.add('filled');
        } else if (index < rating) {
          // Partial star
          star.classList.add('partial');
          const fillPercentage = (rating - Math.floor(rating)) * 100;
          star.style.background = `linear-gradient(90deg, #fbbf24 ${fillPercentage}%, #e5e7eb ${fillPercentage}%)`;
          star.style.webkitBackground = `linear-gradient(90deg, #fbbf24 ${fillPercentage}%, #e5e7eb ${fillPercentage}%)`;
        }
      });
    });
  }
  
  initializeWishlist(container) {
    const wishlistButtons = container.querySelectorAll('.arvidsson-featured-product__wishlist');
    
    wishlistButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleWishlistToggle(button);
      });
    });
  }
  
  initializeQuickView(container) {
    const quickViewButtons = container.querySelectorAll('.arvidsson-featured-product__quick-view');
    
    quickViewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleQuickView(button);
      });
    });
  }
  
  handleWishlistToggle(button) {
    const productId = button.dataset.productId;
    const isInWishlist = this.wishlistItems.includes(productId);
    
    if (isInWishlist) {
      this.removeFromWishlist(productId);
      button.classList.remove('is-active');
      button.setAttribute('aria-label', 'Lägg till i önskelista');
      this.showNotification('Produkt borttagen från önskelista', 'info');
    } else {
      this.addToWishlist(productId);
      button.classList.add('is-active');
      button.setAttribute('aria-label', 'Ta bort från önskelista');
      this.showNotification('Produkt tillagd i önskelista', 'success');
    }
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('wishlist:updated', {
      detail: { 
        productId, 
        action: isInWishlist ? 'remove' : 'add',
        count: this.wishlistItems.length
      }
    }));
  }
  
  addToWishlist(productId) {
    if (!this.wishlistItems.includes(productId)) {
      this.wishlistItems.push(productId);
      localStorage.setItem('arvidsson-wishlist', JSON.stringify(this.wishlistItems));
    }
  }
  
  removeFromWishlist(productId) {
    this.wishlistItems = this.wishlistItems.filter(id => id !== productId);
    localStorage.setItem('arvidsson-wishlist', JSON.stringify(this.wishlistItems));
  }
  
  async handleQuickView(button) {
    const productId = button.dataset.productId;
    
    if (document.querySelector('.arvidsson-quick-view')) {
      return; // Quick view already open
    }
    
    try {
      // Show loading state
      button.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
          <path d="M2 12a10 10 0 0 1 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
      button.disabled = true;
      
      // Fetch product data
      const response = await fetch(`/products/${productId}?view=quick-view`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        this.showQuickView(html);
      } else {
        throw new Error('Failed to load product details');
      }
    } catch (error) {
      console.error('Quick view error:', error);
      this.showNotification('Kunde inte ladda produktdetaljer', 'error');
    } finally {
      // Restore button
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
      `;
      button.disabled = false;
    }
  }
  
  showQuickView(html) {
    const overlay = document.createElement('div');
    overlay.className = 'arvidsson-quick-view';
    overlay.innerHTML = `
      <div class="arvidsson-quick-view__backdrop"></div>
      <div class="arvidsson-quick-view__container">
        <button class="arvidsson-quick-view__close" aria-label="Stäng">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="arvidsson-quick-view__content">
          ${html}
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Add event listeners
    overlay.querySelector('.arvidsson-quick-view__close').addEventListener('click', () => {
      this.closeQuickView();
    });
    
    overlay.querySelector('.arvidsson-quick-view__backdrop').addEventListener('click', () => {
      this.closeQuickView();
    });
    
    // Keyboard navigation
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeQuickView();
      }
    });
    
    // Animate in
    setTimeout(() => {
      overlay.classList.add('is-open');
    }, 10);
    
    // Focus first interactive element
    const firstInput = overlay.querySelector('input, button, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 300);
    }
  }
  
  closeQuickView() {
    const quickView = document.querySelector('.arvidsson-quick-view');
    if (quickView) {
      quickView.classList.remove('is-open');
      setTimeout(() => {
        quickView.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  }
  
  updateWishlistStates(container) {
    const wishlistButtons = container.querySelectorAll('.arvidsson-featured-product__wishlist');
    
    wishlistButtons.forEach(button => {
      const productId = button.dataset.productId;
      if (this.wishlistItems.includes(productId)) {
        button.classList.add('is-active');
        button.setAttribute('aria-label', 'Ta bort från önskelista');
      }
    });
  }
  
  observeContainer(container) {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    const items = container.querySelectorAll('.arvidsson-featured-products__item');
    items.forEach(item => observer.observe(item));
  }
  
  bindGlobalEvents() {
    // Listen for wishlist updates from other modules
    document.addEventListener('wishlist:updated', (e) => {
      this.wishlistItems = JSON.parse(localStorage.getItem('arvidsson-wishlist') || '[]');
      this.containers.forEach(container => {
        this.updateWishlistStates(container);
      });
    });
    
    // Handle section reinitialization (Shopify theme editor)
    document.addEventListener('shopify:section:load', (e) => {
      const sectionId = e.detail.sectionId;
      const container = document.querySelector(`[data-section-id="${sectionId}"][data-section-type="featured-products"]`);
      
      if (container) {
        this.initializeContainer(container);
      }
    });
  }
  
  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.arvidsson-featured-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `arvidsson-featured-notification arvidsson-featured-notification--${type}`;
    notification.innerHTML = `
      <div class="arvidsson-featured-notification__content">
        <div class="arvidsson-featured-notification__icon">
          ${this.getNotificationIcon(type)}
        </div>
        <span class="arvidsson-featured-notification__message">${message}</span>
        <button class="arvidsson-featured-notification__close" aria-label="Stäng">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
    
    // Close button
    notification.querySelector('.arvidsson-featured-notification__close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('is-visible');
    }, 10);
  }
  
  getNotificationIcon(type) {
    const icons = {
      success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <polyline points="16,10 10,16 8,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    };
    
    return icons[type] || icons.info;
  }
  
  // Static methods for external access
  static getWishlistItems() {
    return JSON.parse(localStorage.getItem('arvidsson-wishlist') || '[]');
  }
  
  static addToWishlist(productId) {
    const instance = window.arvidssomFeaturedProducts;
    if (instance) {
      instance.addToWishlist(productId);
    }
  }
  
  static removeFromWishlist(productId) {
    const instance = window.arvidssomFeaturedProducts;
    if (instance) {
      instance.removeFromWishlist(productId);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomFeaturedProducts = new ArvidssomFeaturedProducts();
});

// CSS for notifications and enhancements (injected dynamically)
const featuredProductsStyles = `
  .arvidsson-featured-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 350px;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease-out;
  }
  
  .arvidsson-featured-notification.is-visible {
    transform: translateX(0);
    opacity: 1;
  }
  
  .arvidsson-featured-notification--success {
    border-left: 4px solid #22c55e;
  }
  
  .arvidsson-featured-notification--error {
    border-left: 4px solid #ef4444;
  }
  
  .arvidsson-featured-notification--info {
    border-left: 4px solid #3b82f6;
  }
  
  .arvidsson-featured-notification__content {
    display: flex;
    align-items: center;
    padding: 16px;
    gap: 12px;
  }
  
  .arvidsson-featured-notification__icon {
    flex-shrink: 0;
  }
  
  .arvidsson-featured-notification--success .arvidsson-featured-notification__icon {
    color: #22c55e;
  }
  
  .arvidsson-featured-notification--error .arvidsson-featured-notification__icon {
    color: #ef4444;
  }
  
  .arvidsson-featured-notification--info .arvidsson-featured-notification__icon {
    color: #3b82f6;
  }
  
  .arvidsson-featured-notification__message {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }
  
  .arvidsson-featured-notification__close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
    flex-shrink: 0;
  }
  
  .arvidsson-featured-notification__close:hover {
    background-color: #f3f4f6;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Enhanced visibility states */
  .arvidsson-featured-products__item.is-visible {
    animation-delay: 0s;
  }
  
  .arvidsson-featured-products__item.is-visible:nth-child(1) {
    animation-delay: 0.1s;
  }
  
  .arvidsson-featured-products__item.is-visible:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  @media (max-width: 767px) {
    .arvidsson-featured-notification {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
`;

// Inject styles if not already present
if (!document.getElementById('arvidsson-featured-products-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'arvidsson-featured-products-styles';
  styleSheet.textContent = featuredProductsStyles;
  document.head.appendChild(styleSheet);
}
