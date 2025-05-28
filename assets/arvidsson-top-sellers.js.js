/**
 * Arvidsson Top Sellers Module JavaScript
 * Handles horizontal scrolling, wishlist, and add to cart functionality
 */

class ArvidssomTopSellers {
  constructor() {
    this.containers = document.querySelectorAll('[data-section-type="top-sellers"]');
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
    const track = container.querySelector('[data-top-sellers-track]');
    const prevBtn = container.querySelector('[data-top-sellers-prev]');
    const nextBtn = container.querySelector('[data-top-sellers-next]');
    
    if (!track) return;
    
    const containerData = {
      container,
      track,
      prevBtn,
      nextBtn,
      currentIndex: 0,
      itemWidth: 0,
      maxScroll: 0,
      itemsVisible: 0,
      totalItems: track.children.length
    };
    
    this.setupScrolling(containerData);
    this.initializeStars(container);
    this.initializeWishlist(container);
    this.initializeAddToCart(container);
    this.updateWishlistStates(container);
    
    // Store reference for later use
    container._topSellersData = containerData;
  }
  
  setupScrolling(data) {
    this.calculateDimensions(data);
    this.bindScrollEvents(data);
    this.updateNavigation(data);
    
    // Recalculate on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.calculateDimensions(data);
        this.updateNavigation(data);
      }, 250);
    });
  }
  
  calculateDimensions(data) {
    const { track, container } = data;
    const containerWidth = container.offsetWidth;
    const firstItem = track.children[0];
    
    if (!firstItem) return;
    
    const itemStyle = window.getComputedStyle(firstItem);
    const itemWidth = firstItem.offsetWidth + parseInt(itemStyle.marginRight) || 0;
    const gap = parseInt(window.getComputedStyle(track).gap) || 0;
    
    data.itemWidth = itemWidth + gap;
    data.itemsVisible = Math.floor(containerWidth / data.itemWidth);
    data.maxScroll = Math.max(0, data.totalItems - data.itemsVisible);
    
    // Ensure current index is within bounds
    data.currentIndex = Math.min(data.currentIndex, data.maxScroll);
  }
  
  bindScrollEvents(data) {
    const { prevBtn, nextBtn } = data;
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.scrollPrev(data));
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.scrollNext(data));
    }
    
    // Touch/swipe support
    this.setupTouchEvents(data);
    
    // Keyboard navigation
    data.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.scrollPrev(data);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.scrollNext(data);
      }
    });
  }
  
  setupTouchEvents(data) {
    const { track } = data;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startIndex = 0;
    
    const handleStart = (e) => {
      startX = this.getEventX(e);
      currentX = startX;
      isDragging = true;
      startIndex = data.currentIndex;
      track.style.cursor = 'grabbing';
      track.style.transition = 'none';
    };
    
    const handleMove = (e) => {
      if (!isDragging) return;
      
      currentX = this.getEventX(e);
      const deltaX = currentX - startX;
      const movePercent = deltaX / data.itemWidth;
      const newIndex = Math.max(0, Math.min(data.maxScroll, startIndex - movePercent));
      
      this.updateTrackPosition(data, newIndex);
      
      // Prevent default to avoid scrolling
      if (Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    };
    
    const handleEnd = () => {
      if (!isDragging) return;
      
      isDragging = false;
      track.style.cursor = '';
      track.style.transition = 'transform 0.4s ease-out';
      
      const deltaX = currentX - startX;
      const threshold = data.itemWidth * 0.3;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          this.scrollPrev(data);
        } else {
          this.scrollNext(data);
        }
      } else {
        // Snap back
        this.updateTrackPosition(data, data.currentIndex);
      }
    };
    
    // Mouse events
    track.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    
    // Touch events
    track.addEventListener('touchstart', handleStart, { passive: true });
    track.addEventListener('touchmove', handleMove, { passive: false });
    track.addEventListener('touchend', handleEnd);
  }
  
  getEventX(e) {
    return e.type.includes('touch') ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX;
  }
  
  scrollPrev(data) {
    if (data.currentIndex > 0) {
      data.currentIndex--;
      this.updateTrackPosition(data, data.currentIndex);
      this.updateNavigation(data);
    }
  }
  
  scrollNext(data) {
    if (data.currentIndex < data.maxScroll) {
      data.currentIndex++;
      this.updateTrackPosition(data, data.currentIndex);
      this.updateNavigation(data);
    }
  }
  
  updateTrackPosition(data, index) {
    const { track, itemWidth } = data;
    const translateX = -(index * itemWidth);
    track.style.transform = `translateX(${translateX}px)`;
  }
  
  updateNavigation(data) {
    const { prevBtn, nextBtn, currentIndex, maxScroll } = data;
    
    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
    }
    
    if (nextBtn) {
      nextBtn.disabled = currentIndex >= maxScroll;
    }
  }
  
  initializeStars(container) {
    const starsContainers = container.querySelectorAll('.arvidsson-top-seller-card__stars');
    
    starsContainers.forEach(starsContainer => {
      const rating = parseFloat(starsContainer.dataset.rating) || 0;
      const stars = starsContainer.querySelectorAll('.arvidsson-top-seller-card__star');
      
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
  
  initializeWishlist(container) {
    const wishlistButtons = container.querySelectorAll('.arvidsson-top-seller-card__wishlist');
    
    wishlistButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleWishlistToggle(button);
      });
    });
  }
  
  initializeAddToCart(container) {
    const addToCartButtons = container.querySelectorAll('.arvidsson-top-seller-card__add-to-cart');
    
    addToCartButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAddToCart(button);
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
    } else {
      this.addToWishlist(productId);
      button.classList.add('is-active');
      button.setAttribute('aria-label', 'Ta bort från önskelista');
    }
    
    // Visual feedback
    this.animateButton(button, 'wishlist');
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('wishlist:updated', {
      detail: { 
        productId, 
        action: isInWishlist ? 'remove' : 'add',
        count: this.wishlistItems.length
      }
    }));
  }
  
  async handleAddToCart(button) {
    const productId = button.dataset.productId;
    const variantId = button.dataset.variantId;
    
    if (button.classList.contains('is-loading')) return;
    
    try {
      this.setButtonLoading(button, true);
      
      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', 1);
      
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
        
        // Success feedback
        this.setButtonSuccess(button);
        this.animateButton(button, 'success');
        
        // Trigger cart update event
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { cart, item }
        }));
        
        // Reset button after delay
        setTimeout(() => {
          this.setButtonLoading(button, false);
          button.classList.remove('is-success');
        }, 2000);
        
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      this.setButtonLoading(button, false);
      this.animateButton(button, 'error');
    }
  }
  
  setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('is-loading');
      button.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
          <path d="M2 12a10 10 0 0 1 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
    } else {
      button.classList.remove('is-loading');
      button.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" fill="currentColor"/>
          <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" fill="currentColor"/>
          <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      `;
    }
  }
  
  setButtonSuccess(button) {
    button.classList.add('is-success');
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  
  animateButton(button, type) {
    button.style.transform = 'scale(1.2)';
    setTimeout(() => {
      button.style.transform = '';
    }, 200);
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
  
  updateWishlistStates(container) {
    const wishlistButtons = container.querySelectorAll('.arvidsson-top-seller-card__wishlist');
    
    wishlistButtons.forEach(button => {
      const productId = button.dataset.productId;
      if (this.wishlistItems.includes(productId)) {
        button.classList.add('is-active');
        button.setAttribute('aria-label', 'Ta bort från önskelista');
      }
    });
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
      const container = document.querySelector(`[data-section-id="${sectionId}"][data-section-type="top-sellers"]`);
      
      if (container) {
        this.initializeContainer(container);
      }
    });
  }
  
  // Public methods for external access
  scrollToProduct(container, productId) {
    const data = container._topSellersData;
    if (!data) return;
    
    const productElement = container.querySelector(`[data-product-id="${productId}"]`);
    if (!productElement) return;
    
    const productIndex = Array.from(data.track.children).indexOf(productElement.parentElement);
    if (productIndex !== -1) {
      data.currentIndex = Math.min(productIndex, data.maxScroll);
      this.updateTrackPosition(data, data.currentIndex);
      this.updateNavigation(data);
    }
  }
  
  static scrollToProduct(sectionId, productId) {
    const instance = window.arvidssomTopSellers;
    if (instance) {
      const container = document.querySelector(`[data-section-id="${sectionId}"]`);
      if (container) {
        instance.scrollToProduct(container, productId);
      }
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomTopSellers = new ArvidssomTopSellers();
});