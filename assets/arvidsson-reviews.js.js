/**
 * Arvidsson Reviews Module JavaScript
 * Handles carousel functionality, helpful votes, and interactions
 */

class ArvidssomReviews {
  constructor() {
    this.containers = document.querySelectorAll('[data-section-type="reviews"]');
    this.helpfulVotes = JSON.parse(localStorage.getItem('arvidsson-helpful-votes') || '{}');
    
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
    const isCarousel = container.classList.contains('arvidsson-reviews--carousel');
    
    if (isCarousel) {
      this.setupCarousel(container);
    }
    
    this.initializeHelpfulButtons(container);
    this.animateReviews(container);
  }
  
  setupCarousel(container) {
    const track = container.querySelector('[data-reviews-track]');
    const prevBtn = container.querySelector('[data-reviews-prev]');
    const nextBtn = container.querySelector('[data-reviews-next]');
    const paginationContainer = container.querySelector('[data-reviews-pagination]');
    
    if (!track) return;
    
    const carouselData = {
      container,
      track,
      prevBtn,
      nextBtn,
      paginationContainer,
      currentIndex: 0,
      itemWidth: 0,
      maxScroll: 0,
      itemsVisible: 0,
      totalItems: track.children.length,
      autoplayTimer: null,
      isAutoplay: false
    };
    
    this.calculateCarouselDimensions(carouselData);
    this.createPagination(carouselData);
    this.bindCarouselEvents(carouselData);
    this.updateCarouselNavigation(carouselData);
    
    // Store reference for later use
    container._reviewsCarouselData = carouselData;
    
    // Auto-resize handling
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.calculateCarouselDimensions(carouselData);
        this.updateCarouselNavigation(carouselData);
      }, 250);
    });
  }
  
  calculateCarouselDimensions(data) {
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
  
  createPagination(data) {
    const { paginationContainer, totalItems, itemsVisible } = data;
    
    if (!paginationContainer || totalItems <= itemsVisible) return;
    
    const totalPages = Math.ceil(totalItems / itemsVisible);
    paginationContainer.innerHTML = '';
    
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = `arvidsson-reviews__pagination-dot ${i === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Gå till sida ${i + 1}`);
      dot.dataset.page = i;
      paginationContainer.appendChild(dot);
    }
  }
  
  bindCarouselEvents(data) {
    const { prevBtn, nextBtn, paginationContainer } = data;
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.scrollPrev(data));
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.scrollNext(data));
    }
    
    if (paginationContainer) {
      paginationContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('arvidsson-reviews__pagination-dot')) {
          const page = parseInt(e.target.dataset.page);
          this.goToPage(data, page);
        }
      });
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
    
    // Pause autoplay on hover
    data.container.addEventListener('mouseenter', () => this.pauseAutoplay(data));
    data.container.addEventListener('mouseleave', () => this.resumeAutoplay(data));
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
      this.pauseAutoplay(data);
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
      
      this.resumeAutoplay(data);
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
      this.updateCarousel(data);
    }
  }
  
  scrollNext(data) {
    if (data.currentIndex < data.maxScroll) {
      data.currentIndex++;
      this.updateCarousel(data);
    } else if (data.isAutoplay) {
      // Loop back to start for autoplay
      data.currentIndex = 0;
      this.updateCarousel(data);
    }
  }
  
  goToPage(data, page) {
    const newIndex = Math.min(page * data.itemsVisible, data.maxScroll);
    data.currentIndex = newIndex;
    this.updateCarousel(data);
  }
  
  updateCarousel(data) {
    this.updateTrackPosition(data, data.currentIndex);
    this.updateCarouselNavigation(data);
    this.updatePagination(data);
  }
  
  updateTrackPosition(data, index) {
    const { track, itemWidth } = data;
    const translateX = -(index * itemWidth);
    track.style.transform = `translateX(${translateX}px)`;
  }
  
  updateCarouselNavigation(data) {
    const { prevBtn, nextBtn, currentIndex, maxScroll } = data;
    
    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
    }
    
    if (nextBtn) {
      nextBtn.disabled = currentIndex >= maxScroll && !data.isAutoplay;
    }
  }
  
  updatePagination(data) {
    const { paginationContainer, currentIndex, itemsVisible } = data;
    
    if (!paginationContainer) return;
    
    const currentPage = Math.floor(currentIndex / itemsVisible);
    const dots = paginationContainer.querySelectorAll('.arvidsson-reviews__pagination-dot');
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentPage);
    });
  }
  
  startAutoplay(data, interval = 5000) {
    this.pauseAutoplay(data);
    data.isAutoplay = true;
    
    data.autoplayTimer = setInterval(() => {
      this.scrollNext(data);
    }, interval);
  }
  
  pauseAutoplay(data) {
    if (data.autoplayTimer) {
      clearInterval(data.autoplayTimer);
      data.autoplayTimer = null;
    }
  }
  
  resumeAutoplay(data) {
    if (data.isAutoplay && !data.autoplayTimer) {
      this.startAutoplay(data);
    }
  }
  
  initializeHelpfulButtons(container) {
    const helpfulButtons = container.querySelectorAll('[data-review-helpful]');
    
    helpfulButtons.forEach((button, index) => {
      const reviewId = `review-${container.dataset.sectionId}-${index}`;
      button.dataset.reviewId = reviewId;
      
      // Update button state if already voted
      if (this.helpfulVotes[reviewId]) {
        button.classList.add('is-active');
        this.updateHelpfulCount(button, 1);
      }
      
      button.addEventListener('click', () => this.handleHelpfulVote(button));
    });
  }
  
  handleHelpfulVote(button) {
    const reviewId = button.dataset.reviewId;
    const isAlreadyVoted = this.helpfulVotes[reviewId];
    
    if (isAlreadyVoted) {
      // Remove vote
      delete this.helpfulVotes[reviewId];
      button.classList.remove('is-active');
      this.updateHelpfulCount(button, -1);
    } else {
      // Add vote
      this.helpfulVotes[reviewId] = true;
      button.classList.add('is-active');
      this.updateHelpfulCount(button, 1);
      
      // Visual feedback
      this.animateButton(button);
    }
    
    // Save to localStorage
    localStorage.setItem('arvidsson-helpful-votes', JSON.stringify(this.helpfulVotes));
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('review:helpful-voted', {
      detail: { reviewId, voted: !isAlreadyVoted }
    }));
  }
  
  updateHelpfulCount(button, delta) {
    const countElement = button.querySelector('.arvidsson-review-card__helpful-count');
    if (countElement) {
      const currentCount = parseInt(countElement.textContent.replace(/[()]/g, '')) || 0;
      const newCount = Math.max(0, currentCount + delta);
      countElement.textContent = `(${newCount})`;
    }
  }
  
  animateButton(button) {
    button.style.transform = 'scale(1.1)';
    setTimeout(() => {
      button.style.transform = '';
    }, 200);
  }
  
  animateReviews(container) {
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
    
    const items = container.querySelectorAll('.arvidsson-reviews__item');
    items.forEach(item => observer.observe(item));
  }
  
  bindGlobalEvents() {
    // Handle section reinitialization (Shopify theme editor)
    document.addEventListener('shopify:section:load', (e) => {
      const sectionId = e.detail.sectionId;
      const container = document.querySelector(`[data-section-id="${sectionId}"][data-section-type="reviews"]`);
      
      if (container) {
        this.initializeContainer(container);
      }
    });
    
    // Handle visibility change (pause autoplay when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      this.containers.forEach(container => {
        const data = container._reviewsCarouselData;
        if (data) {
          if (document.hidden) {
            this.pauseAutoplay(data);
          } else {
            this.resumeAutoplay(data);
          }
        }
      });
    });
  }
  
  // Public methods for external access
  goToReview(containerId, reviewIndex) {
    const container = document.querySelector(`[data-section-id="${containerId}"]`);
    if (!container) return;
    
    const data = container._reviewsCarouselData;
    if (data) {
      data.currentIndex = Math.min(reviewIndex, data.maxScroll);
      this.updateCarousel(data);
    }
  }
  
  enableAutoplay(containerId, interval = 5000) {
    const container = document.querySelector(`[data-section-id="${containerId}"]`);
    if (!container) return;
    
    const data = container._reviewsCarouselData;
    if (data) {
      this.startAutoplay(data, interval);
    }
  }
  
  static getHelpfulVotes() {
    return JSON.parse(localStorage.getItem('arvidsson-helpful-votes') || '{}');
  }
  
  static clearHelpfulVotes() {
    localStorage.removeItem('arvidsson-helpful-votes');
    document.dispatchEvent(new CustomEvent('review:helpful-votes-cleared'));
  }
}

/**
 * Review Form Handler (if reviews are collected on-site)
 */
class ArvidssomReviewForm {
  constructor() {
    this.forms = document.querySelectorAll('[data-review-form]');
    
    if (this.forms.length === 0) return;
    
    this.init();
  }
  
  init() {
    this.forms.forEach(form => this.initializeForm(form));
  }
  
  initializeForm(form) {
    const submitButton = form.querySelector('[data-review-submit]');
    const ratingInputs = form.querySelectorAll('[data-rating-input]');
    const starRating = form.querySelector('[data-star-rating]');
    
    if (starRating) {
      this.initializeStarRating(starRating, ratingInputs);
    }
    
    form.addEventListener('submit', (e) => this.handleSubmit(e, form));
  }
  
  initializeStarRating(container, inputs) {
    const stars = container.querySelectorAll('.star-rating__star');
    let currentRating = 0;
    
    stars.forEach((star, index) => {
      const rating = index + 1;
      
      star.addEventListener('mouseenter', () => {
        this.highlightStars(stars, rating);
      });
      
      star.addEventListener('mouseleave', () => {
        this.highlightStars(stars, currentRating);
      });
      
      star.addEventListener('click', () => {
        currentRating = rating;
        this.setRating(inputs, rating);
        this.highlightStars(stars, rating);
      });
    });
  }
  
  highlightStars(stars, rating) {
    stars.forEach((star, index) => {
      star.classList.toggle('filled', index < rating);
    });
  }
  
  setRating(inputs, rating) {
    inputs.forEach(input => {
      if (parseInt(input.value) === rating) {
        input.checked = true;
      }
    });
  }
  
  async handleSubmit(e, form) {
    e.preventDefault();
    
    const submitButton = form.querySelector('[data-review-submit]');
    const formData = new FormData(form);
    
    try {
      this.setSubmitLoading(submitButton, true);
      
      // Here you would submit to your review endpoint
      // For now, we'll simulate a submission
      await this.simulateSubmission(formData);
      
      this.showSuccess(form);
      form.reset();
      
    } catch (error) {
      console.error('Review submission error:', error);
      this.showError(form, 'Ett fel uppstod. Försök igen senare.');
    } finally {
      this.setSubmitLoading(submitButton, false);
    }
  }
  
  async simulateSubmission(formData) {
    // Simulate API delay
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  setSubmitLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = 'Skickar...';
    } else {
      button.disabled = false;
      button.innerHTML = 'Skicka recension';
    }
  }
  
  showSuccess(form) {
    const message = document.createElement('div');
    message.className = 'review-form__success';
    message.innerHTML = `
      <div class="review-form__success-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <polyline points="16,10 10,16 8,14" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>Tack för din recension! Den kommer att granskas innan publicering.</span>
      </div>
    `;
    
    form.parentNode.insertBefore(message, form);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }
  
  showError(form, errorMessage) {
    const message = document.createElement('div');
    message.className = 'review-form__error';
    message.innerHTML = `
      <div class="review-form__error-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>${errorMessage}</span>
      </div>
    `;
    
    form.parentNode.insertBefore(message, form);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomReviews = new ArvidssomReviews();
  window.arvidssomReviewForm = new ArvidssomReviewForm();
});

// Additional styles for review forms
const reviewFormStyles = `
  .review-form__success,
  .review-form__error {
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    animation: slideInUp 0.3s ease-out;
  }
  
  .review-form__success {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }
  
  .review-form__error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }
  
  .review-form__success-content,
  .review-form__error-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .star-rating__star {
    width: 24px;
    height: 24px;
    color: #e5e7eb;
    cursor: pointer;
    transition: color 0.2s;
  }
  
  .star-rating__star:hover,
  .star-rating__star.filled {
    color: #fbbf24;
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject styles if not already present
if (!document.getElementById('arvidsson-reviews-form-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'arvidsson-reviews-form-styles';
  styleSheet.textContent = reviewFormStyles;
  document.head.appendChild(styleSheet);
}