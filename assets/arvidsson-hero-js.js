/**
 * Arvidsson Hero Module JavaScript
 * Handles hero section interactions, video controls, and lazy loading
 */

class ArvidssomHero {
  constructor(element) {
    this.hero = element;
    this.media = this.hero.querySelector('.arvidsson-hero__media');
    this.video = this.hero.querySelector('.arvidsson-hero__video');
    this.image = this.hero.querySelector('.arvidsson-hero__image');
    this.playBtn = this.hero.querySelector('.arvidsson-hero__play-btn');
    this.muteBtn = this.hero.querySelector('.arvidsson-hero__mute-btn');
    this.content = this.hero.querySelector('.arvidsson-hero__content');
    this.cta = this.hero.querySelector('.arvidsson-hero__cta');
    
    // Settings from data attributes
    this.autoplay = this.hero.dataset.autoplay === 'true';
    this.muted = this.hero.dataset.muted !== 'false';
    this.loop = this.hero.dataset.loop === 'true';
    this.parallax = this.hero.dataset.parallax === 'true';
    this.fadeContent = this.hero.dataset.fadeContent === 'true';
    
    // State
    this.isPlaying = false;
    this.isMuted = this.muted;
    this.observer = null;
    this.isVisible = false;
    
    this.init();
  }
  
  init() {
    this.setupMedia();
    this.bindEvents();
    this.setupAccessibility();
    this.setupIntersectionObserver();
    this.handleReducedMotion();
    
    if (this.parallax) {
      this.initParallax();
    }
    
    if (this.fadeContent) {
      this.initContentAnimation();
    }
  }
  
  setupMedia() {
    if (this.video) {
      this.setupVideo();
    }
    
    if (this.image) {
      this.setupImage();
    }
  }
  
  setupVideo() {
    // Set video properties
    this.video.muted = this.isMuted;
    this.video.loop = this.loop;
    this.video.playsInline = true;
    
    // Load video metadata
    if (this.video.readyState >= 1) {
      this.onVideoLoaded();
    } else {
      this.video.addEventListener('loadedmetadata', () => this.onVideoLoaded());
    }
    
    // Video event listeners
    this.video.addEventListener('play', () => this.onVideoPlay());
    this.video.addEventListener('pause', () => this.onVideoPause());
    this.video.addEventListener('ended', () => this.onVideoEnded());
    this.video.addEventListener('error', () => this.onVideoError());
  }
  
  setupImage() {
    // Lazy load image if not already loaded
    if (this.image.dataset.src && !this.image.src) {
      this.lazyLoadImage();
    }
  }
  
  onVideoLoaded() {
    this.hero.classList.add('arvidsson-hero--video-loaded');
    
    // Auto-play if enabled and visible
    if (this.autoplay && this.isVisible) {
      this.playVideo();
    }
    
    // Update button states
    this.updatePlayButton();
    this.updateMuteButton();
  }
  
  bindEvents() {
    // Play/Pause button
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }
    
    // Mute button
    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', () => this.toggleMute());
    }
    
    // Keyboard controls
    this.hero.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Click to play/pause (if no CTA button in the way)
    if (this.video && !this.cta) {
      this.media.addEventListener('click', () => this.togglePlay());
    }
    
    // Scroll events for parallax
    if (this.parallax) {
      window.addEventListener('scroll', () => this.handleScroll());
    }
    
    // Resize events
    window.addEventListener('resize', () => this.handleResize());
    
    // Visibility change
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }
  
  setupAccessibility() {
    // Add ARIA attributes
    if (this.video) {
      this.video.setAttribute('aria-label', 'Hero video');
      
      if (this.playBtn) {
        this.playBtn.setAttribute('aria-label', 'Spela/pausa video');
      }
      
      if (this.muteBtn) {
        this.muteBtn.setAttribute('aria-label', 'Ljud på/av');
      }
    }
    
    // Focus management
    this.hero.setAttribute('tabindex', '0');
    this.hero.setAttribute('role', 'banner');
  }
  
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
          
          if (entry.isIntersecting) {
            this.onHeroVisible();
          } else {
            this.onHeroHidden();
          }
        });
      }, { threshold: 0.3 });
      
      this.observer.observe(this.hero);
    }
  }
  
  onHeroVisible() {
    this.hero.classList.add('arvidsson-hero--visible');
    
    // Auto-play video if enabled
    if (this.video && this.autoplay && !this.isPlaying) {
      this.playVideo();
    }
    
    // Trigger content animations
    if (this.fadeContent) {
      this.animateContent();
    }
  }
  
  onHeroHidden() {
    this.hero.classList.remove('arvidsson-hero--visible');
    
    // Pause video to save bandwidth
    if (this.video && this.isPlaying) {
      this.pauseVideo();
    }
  }
  
  lazyLoadImage() {
    if (this.image && this.image.dataset.src) {
      const img = new Image();
      img.onload = () => {
        this.image.src = this.image.dataset.src;
        this.image.classList.add('arvidsson-hero__image--loaded');
        delete this.image.dataset.src;
      };
      img.src = this.image.dataset.src;
    }
  }
  
  playVideo() {
    if (this.video && !this.isPlaying) {
      const playPromise = this.video.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlaying = true;
          this.updatePlayButton();
        }).catch(error => {
          console.warn('Video autoplay failed:', error);
          this.handleAutoplayError();
        });
      }
    }
  }
  
  pauseVideo() {
    if (this.video && this.isPlaying) {
      this.video.pause();
      this.isPlaying = false;
      this.updatePlayButton();
    }
  }
  
  togglePlay() {
    if (this.video) {
      if (this.isPlaying) {
        this.pauseVideo();
      } else {
        this.playVideo();
      }
    }
  }
  
  toggleMute() {
    if (this.video) {
      this.isMuted = !this.isMuted;
      this.video.muted = this.isMuted;
      this.updateMuteButton();
    }
  }
  
  updatePlayButton() {
    if (this.playBtn) {
      const icon = this.playBtn.querySelector('svg');
      const label = this.playBtn.getAttribute('aria-label');
      
      if (this.isPlaying) {
        this.playBtn.classList.add('is-playing');
        this.playBtn.setAttribute('aria-label', 'Pausa video');
        
        // Update icon to pause
        if (icon) {
          icon.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>';
        }
      } else {
        this.playBtn.classList.remove('is-playing');
        this.playBtn.setAttribute('aria-label', 'Spela video');
        
        // Update icon to play
        if (icon) {
          icon.innerHTML = '<polygon points="5,3 19,12 5,21" fill="currentColor"/>';
        }
      }
    }
  }
  
  updateMuteButton() {
    if (this.muteBtn) {
      const icon = this.muteBtn.querySelector('svg');
      
      if (this.isMuted) {
        this.muteBtn.classList.add('is-muted');
        this.muteBtn.setAttribute('aria-label', 'Slå på ljud');
        
        // Update icon to muted
        if (icon) {
          icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2"/>';
        }
      } else {
        this.muteBtn.classList.remove('is-muted');
        this.muteBtn.setAttribute('aria-label', 'Stäng av ljud');
        
        // Update icon to unmuted
        if (icon) {
          icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" fill="none"/>';
        }
      }
    }
  }
  
  onVideoPlay() {
    this.isPlaying = true;
    this.hero.classList.add('arvidsson-hero--playing');
    this.updatePlayButton();
  }
  
  onVideoPause() {
    this.isPlaying = false;
    this.hero.classList.remove('arvidsson-hero--playing');
    this.updatePlayButton();
  }
  
  onVideoEnded() {
    this.isPlaying = false;
    this.hero.classList.remove('arvidsson-hero--playing');
    this.updatePlayButton();
    
    if (!this.loop) {
      this.hero.classList.add('arvidsson-hero--ended');
    }
  }
  
  onVideoError() {
    this.hero.classList.add('arvidsson-hero--error');
    console.error('Hero video failed to load');
  }
  
  handleAutoplayError() {
    // Show play button if autoplay fails
    if (this.playBtn) {
      this.playBtn.style.display = 'flex';
    }
    
    this.hero.classList.add('arvidsson-hero--autoplay-failed');
  }
  
  handleKeyboard(e) {
    if (this.video) {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          this.toggleMute();
          break;
      }
    }
  }
  
  initParallax() {
    this.handleScroll();
  }
  
  handleScroll() {
    if (!this.parallax || !this.isVisible) return;
    
    requestAnimationFrame(() => {
      const rect = this.hero.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      
      if (this.media) {
        this.media.style.transform = `translateY(${rate}px)`;
      }
    });
  }
  
  initContentAnimation() {
    if (this.content) {
      this.content.classList.add('arvidsson-hero__content--animated');
    }
  }
  
  animateContent() {
    if (this.content) {
      this.content.classList.add('arvidsson-hero__content--visible');
    }
  }
  
  handleResize() {
    // Recalculate parallax or other responsive behaviors
    if (this.parallax) {
      this.handleScroll();
    }
  }
  
  handleVisibilityChange() {
    if (document.visibilityState === 'hidden' && this.isPlaying) {
      this.pauseVideo();
    } else if (document.visibilityState === 'visible' && this.autoplay && this.isVisible) {
      this.playVideo();
    }
  }
  
  handleReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e) => {
      if (e.matches) {
        // Disable parallax and auto-play for reduced motion
        this.parallax = false;
        this.autoplay = false;
        this.pauseVideo();
        this.hero.classList.add('arvidsson-hero--reduced-motion');
      }
    };
    
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
  }
  
  // Public methods
  play() {
    this.playVideo();
  }
  
  pause() {
    this.pauseVideo();
  }
  
  mute() {
    if (this.video && !this.isMuted) {
      this.toggleMute();
    }
  }
  
  unmute() {
    if (this.video && this.isMuted) {
      this.toggleMute();
    }
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.video) {
      this.pauseVideo();
    }
  }
}

/**
 * Hero Manager
 * Handles multiple hero instances
 */
class ArvidssomHeroManager {
  constructor() {
    this.instances = new Map();
    this.init();
  }
  
  init() {
    this.initializeHeroes();
    this.bindGlobalEvents();
  }
  
  initializeHeroes() {
    const heroes = document.querySelectorAll('[data-section-type="hero"]');
    
    heroes.forEach(hero => {
      const id = hero.dataset.sectionId || hero.id;
      if (id && !this.instances.has(id)) {
        const instance = new ArvidssomHero(hero);
        this.instances.set(id, instance);
      }
    });
  }
  
  bindGlobalEvents() {
    // Theme editor events
    document.addEventListener('shopify:section:load', (e) => {
      if (e.detail.sectionId && e.target.dataset.sectionType === 'hero') {
        this.initializeHero(e.target);
      }
    });
    
    document.addEventListener('shopify:section:unload', (e) => {
      if (e.detail.sectionId) {
        this.destroyHero(e.detail.sectionId);
      }
    });
  }
  
  initializeHero(element) {
    const id = element.dataset.sectionId || element.id;
    if (id) {
      const instance = new ArvidssomHero(element);
      this.instances.set(id, instance);
    }
  }
  
  destroyHero(id) {
    const instance = this.instances.get(id);
    if (instance) {
      instance.destroy();
      this.instances.delete(id);
    }
  }
  
  pauseAllVideos() {
    this.instances.forEach(instance => instance.pause());
  }
  
  getInstance(id) {
    return this.instances.get(id);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomHeroManager = new ArvidssomHeroManager();
  window.arvidssomHeroes = window.arvidssomHeroManager.instances;
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.arvidssomHeroManager = new ArvidssomHeroManager();
    window.arvidssomHeroes = window.arvidssomHeroManager.instances;
  });
} else {
  window.arvidssomHeroManager = new ArvidssomHeroManager();
  window.arvidssomHeroes = window.arvidssomHeroManager.instances;
}