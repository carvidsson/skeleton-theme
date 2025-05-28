/**
 * Arvidsson Product Grid Module JavaScript
 * Handles sorting, filtering, wishlist, compare, and quick view functionality
 */

class ArvidssomProductGrid {
  constructor() {
    this.container = document.getElementById('product-grid-container');
    this.sortSelect = document.querySelector('[data-sort-by]');
    this.loadingElement = document.getElementById('grid-loading');
    this.gridElement = document.querySelector('.arvidsson-product-grid__grid');
    
    this.wishlistItems = JSON.parse(localStorage.getItem('arvidsson-wishlist') || '[]');
    this.compareItems = JSON.parse(localStorage.getItem('arvidsson-compare') || '[]');
    
    this.isLoading = false;
    this.currentSort = this.sortSelect?.value || 'manual';
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.initializeStars();
    this.updateWishlistStates();
    this.updateCompareStates();
    this.initializeVariantSwatches();
    this.initializeLazyLoading();
  }
  
  bindEvents() {
    // Sort functionality
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => this.handleSort(e));
    }
    
    // Wishlist buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.arvidsson-product-card__wishlist')) {
        e.preventDefault();
        this.handleWishlist(e.target.closest('.arvidsson-product-card__wishlist'));
      }
    });
    
    // Compare buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.arvidsson-product-card__compare')) {
        e.preventDefault();
        this.handleCompare(e.target.closest('.arvidsson-product-card__compare'));
      }
    });
    
    // Quick view buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.arvidsson-product-card__quick-view')) {
        e.preventDefault();
        this.handleQuickView(e.target.closest('.arvidsson-product-card__quick-view'));
      }
    });
    
    // Variant swatches
    document.addEventListener('click', (e) => {
      if (e.target.closest('.arvidsson-product-card__variant')) {
        e.preventDefault();
        this.handleVariantChange(e.target.closest('.arvidsson-product-card__variant'));
      }
    });
    
    // Add to cart forms
    document.addEventListener('submit', (e) => {
      if (e.target.closest('.arvidsson-product-card__form')) {
        this.handleAddToCart(e);
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.querySelector('.arvidsson-quick-view')) {
        this.closeQuickView();
      }
    });
  }
  
  async handleSort(e) {
    const sortValue = e.target.value;
    if (sortValue === this.currentSort || this.isLoading) return;
    
    this.currentSort = sortValue;
    this.showLoading();
    
    try {
      const url = new URL(window.location);
      url.searchParams.set('sort_by', sortValue);
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newGrid = doc.querySelector('.arvidsson-product-grid__grid');
        const newPagination = doc.querySelector('.arvidsson-product-grid__pagination');
        const newResults = doc.querySelector('.arvidsson-product-grid__results');
        
        if (newGrid) {
          this.gridElement.innerHTML = newGrid.innerHTML;
          this.initializeStars();
          this.updateWishlistStates();
          this.updateCompareStates();
          this.initializeVariantSwatches();
          this.initializeLazyLoading();
        }
        
        // Update pagination
        const paginationElement = document.querySelector('.arvidsson-product-grid__pagination');
        if (paginationElement && newPagination) {
          paginationElement.innerHTML = newPagination.innerHTML;
        } else if (paginationElement && !newPagination) {
          paginationElement.remove();
        }
        
        // Update results count
        const resultsElement = document.querySelector('.arvidsson-product-grid__results');
        if (resultsElement && newResults) {
          resultsElement.innerHTML = newResults.innerHTML;
        }
        
        // Update URL without page reload
        window.history.pushState({}, '', url.toString());
        
      } else {
        throw new Error('Failed to load sorted products');
      }
    } catch (error) {
      console.error('Sort error:', error);
      this.showError('Kunde inte sortera produkterna. Försök igen.');
    } finally {
      this.hideLoading();
    }
  }
  
  handleWishlist(button) {
    const productId = button.dataset.productId;
    const isInWishlist = this.wishlistItems.includes(productId);
    
    if (isInWishlist) {
      this.removeFromWishlist(productId);
      button.classList.remove('is-active');
      button.setAttribute('aria-label', 'Lägg till i önskelista');
    } else {
      this.addToWishlist(productId);
      button.classList.add('is-active');
      button.setAttribute('aria-label', 'Ta bort från önskelista');
    }
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('wishlist:updated', {
      detail: { productId, action: isInWishlist ? 'remove' : 'add' }
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
  
  handleCompare(button) {
    const productId = button.dataset.productId;
    const isInCompare = this.compareItems.includes(productId);
    
    if (isInCompare) {
      this.removeFromCompare(productId);
      button.classList.remove('is-active');
      button.setAttribute('aria-label', 'Jämför produkt');
    } else {
      if (this.compareItems.length >= 4) {
        this.showNotification('Du kan max jämföra 4 produkter åt gången', 'warning');
        return;
      }
      this.addToCompare(productId);
      button.classList.add('is-active');
      button.setAttribute('aria-label', 'Ta bort från jämförelse');
    }
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('compare:updated', {
      detail: { productId, action: isInCompare ? 'remove' : 'add', count: this.compareItems.length }
    }));
  }
  
  addToCompare(productId) {
    if (!this.compareItems.includes(productId) && this.compareItems.length < 4) {
      this.compareItems.push(productId);
      localStorage.setItem('arvidsson-compare', JSON.stringify(this.compareItems));
    }
  }
  
  removeFromCompare(productId) {
    this.compareItems = this.compareItems.filter(id => id !== productId);
    localStorage.setItem('arvidsson-compare', JSON.stringify(this.compareItems));
  }
  
  async handleQuickView(button) {
    const productId = button.dataset.productId;
    
    if (document.querySelector('.arvidsson-quick-view')) {
      return; // Quick view already open
    }
    
    try {
      this.showLoading();
      
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
      this.showError('Kunde inte ladda produktdetaljer');
    } finally {
      this.hideLoading();
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
    
    // Animate in
    setTimeout(() => {
      overlay.classList.add('is-open');
    }, 10);
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
  
  handleVariantChange(variantButton) {
    const variantId = variantButton.dataset.variantId;
    const variantImage = variantButton.dataset.variantImage;
    const productCard = variantButton.closest('.arvidsson-product-card');
    
    // Update active variant
    productCard.querySelectorAll('.arvidsson-product-card__variant').forEach(btn => {
      btn.classList.remove('active');
    });
    variantButton.classList.add('active');
    
    // Update product image
    if (variantImage) {
      const primaryImage = productCard.querySelector('.arvidsson-product-card__image--primary');
      if (primaryImage) {
        primaryImage.src = variantImage;
      }
    }
    
    // Update form input
    const hiddenInput = productCard.querySelector('input[name="id"]');
    if (hiddenInput) {
      hiddenInput.value = variantId;
    }
  }
  
  async handleAddToCart(e) {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('.arvidsson-product-card__add-to-cart');
    const originalText = button.innerHTML;
    
    // Update button state
    button.innerHTML = `
      <div class="loader" style="width: 16px; height: 16px; border-width: 2px;"></div>
      Lägger till...
    `;
    button.disabled = true;
    
    try {
      const formData = new FormData(form);
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        const item = await response.json();
        
        // Update cart count
        const cartResponse = await fetch('/cart.js');
        const cart = await cartResponse.json();
        
        // Trigger cart update event
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { cart, item }
        }));
        
        // Show success feedback
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Tillagd!
        `;
        button.style.backgroundColor = '#22c55e';
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 2000);
        
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Fel uppstod
      `;
      button.style.backgroundColor = '#ef4444';
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = '';
        button.disabled = false;
      }, 2000);
    }
  }
  
  initializeStars() {
    document.querySelectorAll('.arvidsson-product-card__stars').forEach(starsContainer => {
      const rating = parseFloat(starsContainer.dataset.rating) || 0;
      const stars = starsContainer.querySelectorAll('.arvidsson-product-card__star');
      
      stars.forEach((star, index) => {
        if (index < Math.floor(rating)) {
          star.classList.add('filled');
        } else if (index < rating) {
          // Partial star
          star.classList.add('partial');
          const fillPercentage = (rating - Math.floor(rating)) * 100;
          star.style.background = `linear-gradient(90deg, #fbbf24 ${fillPercentage}%, #e5e7eb ${fillPercentage}%)`;
        }
      });
    });
  }
  
  updateWishlistStates() {
    document.querySelectorAll('.arvidsson-product-card__wishlist').forEach(button => {
      const productId = button.dataset.productId;
      if (this.wishlistItems.includes(productId)) {
        button.classList.add('is-active');
        button.setAttribute('aria-label', 'Ta bort från önskelista');
      }
    });
  }
  
  updateCompareStates() {
    document.querySelectorAll('.arvidsson-product-card__compare').forEach(button => {
      const productId = button.dataset.productId;
      if (this.compareItems.includes(productId)) {
        button.classList.add('is-active');
        button.setAttribute('aria-label', 'Ta bort från jämförelse');
      }
    });
  }
  
  initializeVariantSwatches() {
    document.querySelectorAll('.arvidsson-product-card__variants').forEach(container => {
      const firstVariant = container.querySelector('.arvidsson-product-card__variant');
      if (firstVariant) {
        firstVariant.classList.add('active');
      }
    });
  }
  
  initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('.arvidsson-product-card__image[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  showLoading() {
    this.isLoading = true;
    if (this.loadingElement) {
      this.loadingElement.style.display = 'flex';
    }
    if (this.gridElement) {
      this.gridElement.style.opacity = '0.5';
    }
  }
  
  hideLoading() {
    this.isLoading = false;
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
    if (this.gridElement) {
      this.gridElement.style.opacity = '1';
    }
  }
  
  showError(message) {
    this.showNotification(message, 'error');
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `arvidsson-notification arvidsson-notification--${type}`;
    notification.innerHTML = `
      <div class="arvidsson-notification__content">
        <span>${message}</span>
        <button class="arvidsson-notification__close" aria-label="Stäng">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
    
    // Close button
    notification.querySelector('.arvidsson-notification__close').addEventListener('click', () => {
      notification.remove();
    });
  }
  
  // Public methods for external access
  static getWishlistItems() {
    return JSON.parse(localStorage.getItem('arvidsson-wishlist') || '[]');
  }
  
  static getCompareItems() {
    return JSON.parse(localStorage.getItem('arvidsson-compare') || '[]');
  }
  
  static clearWishlist() {
    localStorage.removeItem('arvidsson-wishlist');
    document.dispatchEvent(new CustomEvent('wishlist:cleared'));
  }
  
  static clearCompare() {
    localStorage.removeItem('arvidsson-compare');
    document.dispatchEvent(new CustomEvent('compare:cleared'));
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.arvidsson-product-grid')) {
    window.arvidssomProductGrid = new ArvidssomProductGrid();
  }
});

// Styles for notifications and quick view (injected dynamically)
const styles = `
  .arvidsson-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  }
  
  .arvidsson-notification--error {
    border-left: 4px solid #ef4444;
  }
  
  .arvidsson-notification--warning {
    border-left: 4px solid #f59e0b;
  }
  
  .arvidsson-notification--success {
    border-left: 4px solid #22c55e;
  }
  
  .arvidsson-notification__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    gap: 12px;
  }
  
  .arvidsson-notification__close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .arvidsson-notification__close:hover {
    background-color: #f3f4f6;
  }
  
  .arvidsson-quick-view {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .arvidsson-quick-view.is-open {
    opacity: 1;
  }
  
  .arvidsson-quick-view__backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
  }
  
  .arvidsson-quick-view__container {
    position: relative;
    width: 90%;
    max-width: 800px;
    max-height: 90%;
    margin: 5% auto;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    transform: scale(0.9);
    transition: transform 0.3s ease;
  }
  
  .arvidsson-quick-view.is-open .arvidsson-quick-view__container {
    transform: scale(1);
  }
  
  .arvidsson-quick-view__close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255,255,255,0.9);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1;
    transition: background-color 0.2s;
  }
  
  .arvidsson-quick-view__close:hover {
    background: rgba(255,255,255,1);
  }
  
  .arvidsson-quick-view__content {
    padding: 32px;
    max-height: 80vh;
    overflow-y: auto;
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
  
  @media (max-width: 767px) {
    .arvidsson-notification {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }
    
    .arvidsson-quick-view__container {
      width: 95%;
      margin: 2.5% auto;
    }
    
    .arvidsson-quick-view__content {
      padding: 20px;
    }
  }
`;

// Inject styles
if (!document.getElementById('arvidsson-product-grid-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'arvidsson-product-grid-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
