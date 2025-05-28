/**
 * Arvidsson Promotion Module JavaScript
 * Handles carousel functionality, autoplay, touch gestures, and navigation
 */

class ArvidssomPromotion {
  constructor(element) {
    this.container = element;
    this.slidesContainer = this.container.querySelector('[data-promotion-slides]');
    this.slides = Array.from(this.container.querySelectorAll('.arvidsson-promotion__slide'));
    this.prevButton = this.container.querySelector('[data-promotion-prev]');
    this.nextButton = this.container.querySelector('[data-promotion-next]');
    this.paginationContainer = this.container.querySelector('[data-promotion-pagination]');
    this.paginationDots = Array.from(this.container.querySelectorAll('.arvidsson-promotion__pagination-dot'));
    this.progressBar = this.container.querySelector('[data-promotion-progress]');
    
    // Settings
    this.autoplay = this.container.dataset.autoplay === 'true';
    this.slideDuration = parseInt(this.container.dataset.slideDuration) || 5000;
    this.isCarousel = this.container.classList.contains('arvidsson-promotion--carousel');
    
    // State
    this.currentSlide = 0;
    this.totalSlides = this.slides.length;
    this.isPlaying = false;
    this.autoplayTimer = null;
    this.progressTimer = null;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;
    this.initialTransform = 0;
    
    // Ensure we have slides before initializing
    if (this.totalSlides === 0 || !this.isCarousel) return;
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.setActiveSlide(0);
    
    if (this.autoplay) {
      this.startAutoplay();
    }
    
    // Set up intersection observer for performance
    this.setupIntersectionObserver();
    
    // Initialize accessibility
    this.setupAccessibility();
  }
  
  bindEvents() {
    // Navigation buttons
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.prevSlide());
    }
    
    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.nextSlide());
    }
    
    // Pagination dots
    this.paginationDots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToSlide(index));
    });
    
    // Touch/swipe events
    this.setupTouchEvents();
    
    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Pause autoplay on hover
    this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
    this.container.addEventListener('mouseleave', () => this.resumeAutoplay());
    
    // Pause autoplay when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAutoplay();
      } else {
        this.resumeAutoplay();
      }
    });
    
    // Resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateSlidePosition(false);
      }, 250);
    });
  }
  
  setupTouchEvents() {
    if (!this.slidesContainer) return;
    
    // Mouse events
    this.slidesContainer.addEventListener('mousedown', (e) => this.handleStart(e));
    this.slidesContainer.addEventListener('mousemove', (e) => this.handleMove(e));
    this.slidesContainer.addEventListener('mouseup', (e) => this.handleEnd(e));
    this.slidesContainer.addEventListener('mouseleave', (e) => this.handleEnd(e));
    
    // Touch events
    this.slidesContainer.addEventListener('touchstart', (e) => this.handleStart(e), { passive: true });
    this.slidesContainer.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
    this.slidesContainer.addEventListener('touchend', (e) => this.handleEnd(e));
    
    // Prevent context menu on long press
    this.slidesContainer.addEventListener('contextmenu', (e) => {
      if (this.isDragging) {
        e.preventDefault();
      }
    });
  }
  
  handleStart(e) {
    if (this.totalSlides <= 1) return;
    
    this.isDragging = true;
    this.startX = this.getEventX(e);
    this.currentX = this.startX;
    this.initialTransform = this.currentSlide * -100;
    
    this.slidesContainer.classList.add('is-dragging');
    this.pauseAutoplay();
    
    // Prevent default for mouse events to avoid text selection
    if (e.type === 'mousedown') {
      e.preventDefault();
    }
  }
  
  handleMove(e) {
    if (!this.isDragging || this.totalSlides <= 1) return;
    
    this.currentX = this.getEventX(e);
    const deltaX = this.currentX - this.startX;
    const deltaPercent = (deltaX / this.container.offsetWidth) * 100;
    const newTransform = this.initialTransform + deltaPercent;
    
    // Add resistance at edges
    const resistanceTransform = this.applyResistance(newTransform);
    
    this.slidesContainer.style.transform = `translateX(${resistanceTransform}%)`;
    
    // Prevent default for touchmove to avoid scrolling
    if (e.type === 'touchmove' && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  }
  
  handleEnd(e) {
    if (!this.isDragging || this.totalSlides <= 1) return;
    
    this.isDragging = false;
    this.slidesContainer.classList.remove('is-dragging');
    
    const deltaX = this.currentX - this.startX;
    const threshold = this.container.offsetWidth * 0.2; // 20% threshold
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    } else {
      // Snap back to current slide
      this.updateSlidePosition(true);
    }
    
    this.resumeAutoplay();
  }
  
  getEventX(e) {
    return e.type.includes('touch') ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX;
  }
  
  applyResistance(transform) {
    const maxTransform = 0;
    const minTransform = -(this.totalSlides - 1) * 100;
    
    if (transform > maxTransform) {
      return maxTransform + (transform - maxTransform) * 0.3;
    } else if (transform < minTransform) {
      return minTransform + (transform - minTransform) * 0.3;
    }
    
    return transform;
  }
  
  handleKeyboard(e) {
    if (!this.container.contains(document.activeElement)) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.prevSlide();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.nextSlide();
        break;
      case 'Home':
        e.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        this.goToSlide(this.totalSlides - 1);
        break;
      case ' ':
        e.preventDefault();
        this.toggleAutoplay();
        break;
    }
  }
  
  prevSlide() {
    const newSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
    this.goToSlide(newSlide);
  }
  
  nextSlide() {
    const newSlide = this.currentSlide === this.totalSlides - 1 ? 0 : this.currentSlide + 1;
    this.goToSlide(newSlide);
  }
  
  goToSlide(index) {
    if (index === this.currentSlide || index < 0 || index >= this.totalSlides) return;
    
    this.setActiveSlide(index);
    this.updateSlidePosition(true);
    this.updatePagination();
    this.updateNavigation();
    
    // Restart autoplay progress
    if (this.autoplay && this.isPlaying) {
      this.startProgressAnimation();
    }
    
    // Trigger custom event
    this.container.dispatchEvent(new CustomEvent('slide:changed', {
      detail: { 
        currentSlide: this.currentSlide, 
        totalSlides: this.totalSlides,
        slide: this.slides[this.currentSlide]
      }
    }));
  }
  
  setActiveSlide(index) {
    // Remove active class from all slides
    this.slides.forEach(slide => slide.classList.remove('active'));
    
    // Add active class to current slide
    if (this.slides[index]) {
      this.slides[index].classList.add('active');
    }
    
    this.currentSlide = index;
  }
  
  updateSlidePosition(animate = true) {
    if (!this.slidesContainer) return;
    
    const transform = `translateX(${this.currentSlide * -100}%)`;
    
    if (animate) {
      this.slidesContainer.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      this.slidesContainer.style.transition = 'none';
    }
    
    this.slidesContainer.style.transform = transform;
    
    // Re-enable transition after immediate update
    if (!animate) {
      requestAnimationFrame(() => {
        this.slidesContainer.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    }
  }
  
  updatePagination() {
    this.paginationDots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentSlide);
      dot.setAttribute('aria-current', index === this.currentSlide ? 'true' : 'false');
    });
  }
  
  updateNavigation() {
    if (this.prevButton) {
      this.prevButton.disabled = false;
      this.prevButton.setAttribute('aria-label', 
        `Föregående kampanj (${this.currentSlide === 0 ? this.totalSlides : this.currentSlide} av ${this.totalSlides})`
      );
    }
    
    if (this.nextButton) {
      this.nextButton.disabled = false;
      this.nextButton.setAttribute('aria-label', 
        `Nästa kampanj (${this.currentSlide + 2 > this.totalSlides ? 1 : this.currentSlide + 2} av ${this.totalSlides})`
      );
    }
  }
  
  startAutoplay() {
    if (this.totalSlides <= 1) return;
    
    this.isPlaying = true;
    this.autoplayTimer = setInterval(() => {
      this.nextSlide();
    }, this.slideDuration);
    
    this.startProgressAnimation();
  }
  
  pauseAutoplay() {
    this.isPlaying = false;
    clearInterval(this.autoplayTimer);
    clearInterval(this.progressTimer);
    
    if (this.progressBar) {
      this.progressBar.style.transition = 'none';
      this.progressBar.style.width = '0%';
    }
  }
  
  resumeAutoplay() {
    if (this.autoplay && !this.isDragging) {
      this.startAutoplay();
    }
  }
  
  toggleAutoplay() {
    if (this.isPlaying) {
      this.pauseAutoplay();
    } else {
      this.startAutoplay();
    }
  }
  
  startProgressAnimation() {
    if (!this.progressBar) return;
    
    clearInterval(this.progressTimer);
    
    this.progressBar.style.transition = 'none';
    this.progressBar.style.width = '0%';
    
    requestAnimationFrame(() => {
      this.progressBar.style.transition = `width ${this.slideDuration}ms linear`;
      this.progressBar.style.width = '100%';
    });
  }
  
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (this.autoplay && !this.isPlaying) {
            this.startAutoplay();
          }
        } else {
          this.pauseAutoplay();
        }
      });
    }, {
      threshold: 0.5
    });
    
    observer.observe(this.container);
  }
  
  setupAccessibility() {
    // Set ARIA attributes
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Kampanjkarusell');
    
    if (this.slidesContainer) {
      this.slidesContainer.setAttribute('role', 'tablist');
      this.slidesContainer.setAttribute('aria-live', 'polite');
    }
    
    this.slides.forEach((slide, index) => {
      slide.setAttribute('role', 'tabpanel');
      slide.setAttribute('aria-label', `Kampanj ${index + 1} av ${this.totalSlides}`);
      slide.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
    
    this.paginationDots.forEach((dot, index) => {
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-controls', `slide-${index}`);
      dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    });
    
    // Add focus management
    this.container.setAttribute('tabindex', '0');
  }
  
  // Public methods
  destroy() {
    this.pauseAutoplay();
    
    // Remove event listeners
    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this.prevSlide);
    }
    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this.nextSlide);
    }
    
    this.paginationDots.forEach((dot, index) => {
      dot.removeEventListener('click', () => this.goToSlide(index));
    });
    
    // Reset styles
    if (this.slidesContainer) {
      this.slidesContainer.style.transform = '';
      this.slidesContainer.style.transition = '';
      this.slidesContainer.classList.remove('is-dragging');
    }
    
    this.slides.forEach(slide => slide.classList.remove('active'));
  }
  
  getCurrentSlide() {
    return this.currentSlide;
  }
  
  getTotalSlides() {
    return this.totalSlides;
  }
  
  isAutoplayActive() {
    return this.isPlaying;
  }
}

/**
 * Initialize all promotion carousels on the page
 */
class ArvidssomPromotionManager {
  constructor() {
    this.promotions = new Map();
    this.init();
  }
  
  init() {
    this.initializePromotions();
    this.bindGlobalEvents();
  }
  
  initializePromotions() {
    const promotionElements = document.querySelectorAll('[data-section-type="promotion"]');
    
    promotionElements.forEach(element => {
      const sectionId = element.dataset.sectionId;
      const promotion = new ArvidssomPromotion(element);
      this.promotions.set(sectionId, promotion);
    });
  }
  
  bindGlobalEvents() {
    // Reinitialize on section reload (Shopify theme editor)
    document.addEventListener('shopify:section:load', (e) => {
      if (e.detail.sectionId) {
        const element = document.querySelector(`[data-section-id="${e.detail.sectionId}"]`);
        if (element && element.dataset.sectionType === 'promotion') {
          this.destroyPromotion(e.detail.sectionId);
          const promotion = new ArvidssomPromotion(element);
          this.promotions.set(e.detail.sectionId, promotion);
        }
      }
    });
    
    // Clean up on section unload
    document.addEventListener('shopify:section:unload', (e) => {
      if (e.detail.sectionId) {
        this.destroyPromotion(e.detail.sectionId);
      }
    });
    
    // Handle section reorder
    document.addEventListener('shopify:section:reorder', () => {
      this.destroyAll();
      this.initializePromotions();
    });
  }
  
  destroyPromotion(sectionId) {
    const promotion = this.promotions.get(sectionId);
    if (promotion) {
      promotion.destroy();
      this.promotions.delete(sectionId);
    }
  }
  
  destroyAll() {
    this.promotions.forEach(promotion => promotion.destroy());
    this.promotions.clear();
  }
  
  getPromotion(sectionId) {
    return this.promotions.get(sectionId);
  }
  
  getAllPromotions() {
    return Array.from(this.promotions.values());
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomPromotionManager = new ArvidssomPromotionManager();
});

// Export for potential external access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ArvidssomPromotion, ArvidssomPromotionManager };
}
