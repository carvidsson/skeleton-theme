/**
 * Arvidsson Marquee Module JavaScript
 * Handles scrolling animation, pause/play controls, and accessibility features
 */

class ArvidssomMarquee {
  constructor(element) {
    this.marquee = element;
    this.container = this.marquee.querySelector('.arvidsson-marquee__container');
    this.content = this.marquee.querySelector('.arvidsson-marquee__content');
    this.duplicate = this.marquee.querySelector('.arvidsson-marquee__content--duplicate');
    this.pauseBtn = this.marquee.querySelector('[data-marquee-pause]');
    this.playBtn = this.marquee.querySelector('[data-marquee-play]');
    
    // Settings from data attributes
    this.speed = parseInt(this.marquee.dataset.marqueeSpeed) || 30;
    this.pauseOnHover = this.marquee.dataset.pauseOnHover === 'true';
    this.isEnabled = !this.marquee.classList.contains('arvidsson-marquee--disabled');
    
    // State
    this.isPaused = false;
    this.animationId = null;
    this.observer = null;
    
    this.init();
  }
  
  init() {
    if (this.isEnabled) {
      this.setupAnimation();
      this.bindEvents();
      this.setupAccessibility();
      this.handleReducedMotion();
    }
  }
  
  setupAnimation() {
    // Set CSS custom property for animation duration
    this.marquee.style.setProperty('--marquee-duration', `${this.speed}s`);
    
    // Ensure content is duplicated for seamless loop
    if (this.duplicate && this.content) {
      this.duplicate.innerHTML = this.content.innerHTML;
    }
    
    // Start animation if not reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.startAnimation();
    }
  }
  
  bindEvents() {
    // Pause/Play controls
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.pause());
    }
    
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.play());
    }
    
    // Hover events
    if (this.pauseOnHover) {
      this.marquee.addEventListener('mouseenter', () => this.pauseAnimation());
      this.marquee.addEventListener('mouseleave', () => this.resumeAnimation());
    }
    
    // Focus events for accessibility
    this.marquee.addEventListener('focusin', () => this.pauseAnimation());
    this.marquee.addEventListener('focusout', () => this.resumeAnimation());
    
    // Keyboard navigation
    this.marquee.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Visibility change (pause when page is hidden)
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Resize events
    window.addEventListener('resize', () => this.handleResize());
    
    // Intersection observer for performance
    this.setupIntersectionObserver();
  }
  
  setupAccessibility() {
    // Add ARIA attributes
    this.marquee.setAttribute('role', 'banner');
    this.marquee.setAttribute('aria-live', 'polite');
    this.marquee.setAttribute('aria-label', 'Rullande meddelanden');
    
    // Make duplicate content aria-hidden
    if (this.duplicate) {
      this.duplicate.setAttribute('aria-hidden', 'true');
    }
  }
  
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.resumeAnimation();
          } else {
            this.pauseAnimation();
          }
        });
      }, { threshold: 0.1 });
      
      this.observer.observe(this.marquee);
    }
  }
  
  handleReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e) => {
      if (e.matches) {
        this.pauseAnimation();
        this.marquee.classList.add('arvidsson-marquee--reduced-motion');
      } else {
        this.marquee.classList.remove('arvidsson-marquee--reduced-motion');
        this.resumeAnimation();
      }
    };
    
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
  }
  
  startAnimation() {
    if (this.content) {
      this.marquee.style.setProperty('--marquee-play-state', 'running');
    }
  }
  
  pauseAnimation() {
    if (this.content && !this.isPaused) {
      this.marquee.style.setProperty('--marquee-play-state', 'paused');
    }
  }
  
  resumeAnimation() {
    if (this.content && !this.isPaused && this.isEnabled) {
      this.marquee.style.setProperty('--marquee-play-state', 'running');
    }
  }
  
  pause() {
    this.isPaused = true;
    this.marquee.classList.add('is-paused');
    this.pauseAnimation();
    
    // Update ARIA live region
    this.marquee.setAttribute('aria-live', 'off');
    
    // Focus management
    if (this.playBtn) {
      this.playBtn.focus();
    }
  }
  
  play() {
    this.isPaused = false;
    this.marquee.classList.remove('is-paused');
    this.resumeAnimation();
    
    // Update ARIA live region
    this.marquee.setAttribute('aria-live', 'polite');
    
    // Focus management
    if (this.pauseBtn) {
      this.pauseBtn.focus();
    }
  }
  
  handleKeyboard(e) {
    // Space or Enter to toggle pause/play
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
    
    // Escape to pause
    if (e.key === 'Escape') {
      this.pause();
    }
  }
  
  toggle() {
    if (this.isPaused) {
      this.play();
    } else {
      this.pause();
    }
  }
  
  handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this.pauseAnimation();
    } else if (document.visibilityState === 'visible' && !this.isPaused) {
      this.resumeAnimation();
    }
  }
  
  handleResize() {
    // Recalculate animation if needed
    if (this.isEnabled && !this.isPaused) {
      this.pauseAnimation();
      setTimeout(() => {
        this.resumeAnimation();
      }, 100);
    }
  }
  
  // Public Methods
  setSpeed(speed) {
    this.speed = speed;
    this.marquee.style.setProperty('--marquee-duration', `${speed}s`);
  }
  
  setText(text) {
    if (this.content) {
      const textElement = this.content.querySelector('.arvidsson-marquee__text');
      if (textElement) {
        textElement.textContent = text;
        
        // Update duplicate as well
        if (this.duplicate) {
          const duplicateText = this.duplicate.querySelector('.arvidsson-marquee__text');
          if (duplicateText) {
            duplicateText.textContent = text;
          }
        }
      }
    }
  }
  
  destroy() {
    // Clean up event listeners
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Remove animation
    this.pauseAnimation();
    
    // Clear any timeouts
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  // Static method for external updates
  static updateText(marqueeId, text) {
    const instance = window.arvidssomMarquees?.[marqueeId];
    if (instance) {
      instance.setText(text);
    }
  }
  
  static pauseAll() {
    if (window.arvidssomMarquees) {
      Object.values(window.arvidssomMarquees).forEach(instance => {
        instance.pause();
      });
    }
  }
  
  static playAll() {
    if (window.arvidssomMarquees) {
      Object.values(window.arvidssomMarquees).forEach(instance => {
        instance.play();
      });
    }
  }
}

/**
 * Marquee Manager
 * Handles multiple marquee instances
 */
class ArvidssomMarqueeManager {
  constructor() {
    this.instances = new Map();
    this.init();
  }
  
  init() {
    this.initializeMarquees();
    this.bindGlobalEvents();
  }
  
  initializeMarquees() {
    const marquees = document.querySelectorAll('[data-section-type="marquee"]');
    
    marquees.forEach(marquee => {
      const id = marquee.dataset.sectionId || marquee.id;
      if (id && !this.instances.has(id)) {
        const instance = new ArvidssomMarquee(marquee);
        this.instances.set(id, instance);
      }
    });
  }
  
  bindGlobalEvents() {
    // Listen for section loading (theme editor)
    document.addEventListener('shopify:section:load', (e) => {
      if (e.detail.sectionId && e.target.dataset.sectionType === 'marquee') {
        this.initializeMarquee(e.target);
      }
    });
    
    // Listen for section unloading
    document.addEventListener('shopify:section:unload', (e) => {
      if (e.detail.sectionId) {
        this.destroyMarquee(e.detail.sectionId);
      }
    });
    
    // Global pause on focus (for better accessibility)
    document.addEventListener('focus', (e) => {
      if (e.target.matches('input, textarea, select, button, a')) {
        this.pauseAll();
      }
    }, true);
  }
  
  initializeMarquee(element) {
    const id = element.dataset.sectionId || element.id;
    if (id) {
      const instance = new ArvidssomMarquee(element);
      this.instances.set(id, instance);
    }
  }
  
  destroyMarquee(id) {
    const instance = this.instances.get(id);
    if (instance) {
      instance.destroy();
      this.instances.delete(id);
    }
  }
  
  pauseAll() {
    this.instances.forEach(instance => instance.pause());
  }
  
  playAll() {
    this.instances.forEach(instance => instance.play());
  }
  
  getInstance(id) {
    return this.instances.get(id);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomMarqueeManager = new ArvidssomMarqueeManager();
  
  // Expose instances globally for external access
  window.arvidssomMarquees = window.arvidssomMarqueeManager.instances;
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.arvidssomMarqueeManager = new ArvidssomMarqueeManager();
    window.arvidssomMarquees = window.arvidssomMarqueeManager.instances;
  });
} else {
  window.arvidssomMarqueeManager = new ArvidssomMarqueeManager();
  window.arvidssomMarquees = window.arvidssomMarqueeManager.instances;
}