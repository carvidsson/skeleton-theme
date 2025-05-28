/**
 * Arvidsson Shop by Room Module JavaScript
 * Handles room category interactions, filtering, and animations
 */

class ArvidssomShopByRoom {
  constructor(element) {
    this.section = element;
    this.grid = this.section.querySelector('.arvidsson-shop-by-room__grid');
    this.items = this.section.querySelectorAll('.arvidsson-shop-by-room__item');
    this.images = this.section.querySelectorAll('.arvidsson-shop-by-room__image');
    this.loadMoreBtn = this.section.querySelector('.arvidsson-shop-by-room__load-more');
    this.filters = this.section.querySelectorAll('.arvidsson-shop-by-room__filter');
    
    // Settings from data attributes
    this.animateOnScroll = this.section.dataset.animateOnScroll === 'true';
    this.hoverEffect = this.section.dataset.hoverEffect || 'scale';
    this.loadMoreEnabled = this.section.dataset.loadMore === 'true';
    this.initialItems = parseInt(this.section.dataset.initialItems) || 6;
    
    // State
    this.currentFilter = 'all';
    this.visibleItems = this.initialItems;
    this.allItems = Array.from(this.items);
    this.filteredItems = [...this.allItems];
    this.observer = null;
    this.isAnimating = false;
    
    this.init();
  }
  
  init() {
    this.setupItems();
    this.bindEvents();
    this.setupLazyLoading();
    this.setupAccessibility();
    
    if (this.animateOnScroll) {
      this.setupScrollAnimation();
    }
    
    if (this.loadMoreEnabled) {
      this.setupLoadMore();
    }
  }
  
  setupItems() {
    // Hide items beyond initial count if load more is enabled
    if (this.loadMoreEnabled) {
      this.allItems.forEach((item, index) => {
        if (index >= this.initialItems) {
          item.style.display = 'none';
          item.classList.add('arvidsson-shop-by-room__item--hidden');
        }
      });
    }
    
    // Add hover effects
    this.items.forEach(item => {
      item.classList.add(`arvidsson-shop-by-room__item--${this.hoverEffect}`);
    });
  }
  
  bindEvents() {
    // Item click events
    this.items.forEach(item => {
      const link = item.querySelector('.arvidsson-shop-by-room__link');
      
      // Enhanced click handling
      item.addEventListener('click', (e) => this.handleItemClick(e, item));
      
      // Hover events for enhanced effects
      item.addEventListener('mouseenter', (e) => this.handleItemHover(e, item));
      item.addEventListener('mouseleave', (e) => this.handleItemLeave(e, item));
      
      // Focus events for accessibility
      if (link) {
        link.addEventListener('focus', (e) => this.handleItemFocus(e, item));
        link.addEventListener('blur', (e) => this.handleItemBlur(e, item));
      }
    });
    
    // Filter events
    this.filters.forEach(filter => {
      filter.addEventListener('click', (e) => this.handleFilterClick(e, filter));
    });
    
    // Load more button
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMore());
    }
    
    // Keyboard navigation
    this.section.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Resize events
    window.addEventListener('resize', () => this.handleResize());
  }
  
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            imageObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      this.images.forEach(img => {
        if (img.dataset.src) {
          imageObserver.observe(img);
        }
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      this.images.forEach(img => this.loadImage(img));
    }
  }
  
  loadImage(img) {
    if (img.dataset.src) {
      const image = new Image();
      image.onload = () => {
        img.src = img.dataset.src;
        img.classList.add('arvidsson-shop-by-room__image--loaded');
        delete img.dataset.src;
      };
      image.onerror = () => {
        img.classList.add('arvidsson-shop-by-room__image--error');
      };
      image.src = img.dataset.src;
    }
  }
  
  setupScrollAnimation() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateItem(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, { 
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      });
      
      this.items.forEach(item => {
        item.classList.add('arvidsson-shop-by-room__item--animate');
        this.observer.observe(item);
      });
    }
  }
  
  animateItem(item) {
    const delay = Array.from(this.items).indexOf(item) * 100;
    setTimeout(() => {
      item.classList.add('arvidsson-shop-by-room__item--visible');
    }, delay);
  }
  
  setupAccessibility() {
    // Add ARIA attributes
    this.section.setAttribute('role', 'region');
    this.section.setAttribute('aria-label', 'Handla efter rum');
    
    // Grid role
    if (this.grid) {
      this.grid.setAttribute('role', 'grid');
    }
    
    // Item roles and states
    this.items.forEach((item, index) => {
      item.setAttribute('role', 'gridcell');
      item.setAttribute('tabindex', '0');
      
      const link = item.querySelector('.arvidsson-shop-by-room__link');
      if (link) {
        link.setAttribute('aria-describedby', `room-desc-${index}`);
      }
    });
    
    // Filter accessibility
    this.filters.forEach(filter => {
      filter.setAttribute('role', 'button');
      filter.setAttribute('aria-pressed', 'false');
    });
  }
  
  setupLoadMore() {
    if (this.allItems.length <= this.initialItems) {
      this.hideLoadMoreButton();
    }
  }
  
  handleItemClick(e, item) {
    const link = item.querySelector('.arvidsson-shop-by-room__link');
    
    // Don't interfere with normal link behavior
    if (e.target === link || link?.contains(e.target)) {
      return;
    }
    
    // Add click animation
    item.classList.add('arvidsson-shop-by-room__item--clicked');
    setTimeout(() => {
      item.classList.remove('arvidsson-shop-by-room__item--clicked');
    }, 300);
    
    // Navigate to link if exists
    if (link) {
      const href = link.getAttribute('href');
      if (href) {
        window.location.href = href;
      }
    }
  }
  
  handleItemHover(e, item) {
    item.classList.add('arvidsson-shop-by-room__item--hover');
    
    // Add stagger effect to nearby items
    const index = Array.from(this.items).indexOf(item);
    this.items.forEach((otherItem, otherIndex) => {
      const distance = Math.abs(index - otherIndex);
      if (distance > 0 && distance <= 2) {
        otherItem.style.transitionDelay = `${distance * 50}ms`;
        otherItem.classList.add('arvidsson-shop-by-room__item--nearby');
      }
    });
  }
  
  handleItemLeave(e, item) {
    item.classList.remove('arvidsson-shop-by-room__item--hover');
    
    // Remove stagger effects
    this.items.forEach(otherItem => {
      otherItem.style.transitionDelay = '';
      otherItem.classList.remove('arvidsson-shop-by-room__item--nearby');
    });
  }
  
  handleItemFocus(e, item) {
    item.classList.add('arvidsson-shop-by-room__item--focused');
  }
  
  handleItemBlur(e, item) {
    item.classList.remove('arvidsson-shop-by-room__item--focused');
  }
  
  handleFilterClick(e, filter) {
    e.preventDefault();
    
    const filterValue = filter.dataset.filter || 'all';
    
    if (filterValue !== this.currentFilter) {
      this.setActiveFilter(filter);
      this.filterItems(filterValue);
    }
  }
  
  setActiveFilter(activeFilter) {
    // Update filter states
    this.filters.forEach(filter => {
      filter.classList.remove('active');
      filter.setAttribute('aria-pressed', 'false');
    });
    
    activeFilter.classList.add('active');
    activeFilter.setAttribute('aria-pressed', 'true');
    
    this.currentFilter = activeFilter.dataset.filter || 'all';
  }
  
  filterItems(filterValue) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.section.classList.add('arvidsson-shop-by-room--filtering');
    
    // Hide all items first
    this.allItems.forEach(item => {
      item.classList.add('arvidsson-shop-by-room__item--hiding');
    });
    
    setTimeout(() => {
      // Filter items
      this.filteredItems = this.allItems.filter(item => {
        if (filterValue === 'all') return true;
        
        const itemCategories = item.dataset.categories?.split(',') || [];
        return itemCategories.includes(filterValue);
      });
      
      // Show/hide items
      this.allItems.forEach(item => {
        const shouldShow = this.filteredItems.includes(item);
        
        if (shouldShow) {
          item.style.display = '';
          item.classList.remove('arvidsson-shop-by-room__item--hiding');
          item.classList.add('arvidsson-shop-by-room__item--showing');
        } else {
          item.style.display = 'none';
          item.classList.remove('arvidsson-shop-by-room__item--showing');
        }
      });
      
      // Update load more visibility
      this.updateLoadMoreVisibility();
      
      setTimeout(() => {
        this.allItems.forEach(item => {
          item.classList.remove('arvidsson-shop-by-room__item--showing');
        });
        
        this.section.classList.remove('arvidsson-shop-by-room--filtering');
        this.isAnimating = false;
      }, 300);
      
    }, 200);
  }
  
  loadMore() {
    if (this.isAnimating) return;
    
    const hiddenItems = this.filteredItems.filter(item => 
      item.classList.contains('arvidsson-shop-by-room__item--hidden')
    );
    
    const itemsToShow = hiddenItems.slice(0, this.initialItems);
    
    if (itemsToShow.length === 0) {
      this.hideLoadMoreButton();
      return;
    }
    
    this.isAnimating = true;
    this.loadMoreBtn.classList.add('arvidsson-shop-by-room__load-more--loading');
    
    setTimeout(() => {
      itemsToShow.forEach((item, index) => {
        setTimeout(() => {
          item.style.display = '';
          item.classList.remove('arvidsson-shop-by-room__item--hidden');
          item.classList.add('arvidsson-shop-by-room__item--showing');
          
          if (this.animateOnScroll) {
            this.animateItem(item);
          }
        }, index * 100);
      });
      
      setTimeout(() => {
        itemsToShow.forEach(item => {
          item.classList.remove('arvidsson-shop-by-room__item--showing');
        });
        
        this.loadMoreBtn.classList.remove('arvidsson-shop-by-room__load-more--loading');
        this.isAnimating = false;
        
        // Hide load more button if no more items
        const remainingHidden = this.filteredItems.filter(item => 
          item.classList.contains('arvidsson-shop-by-room__item--hidden')
        );
        
        if (remainingHidden.length === 0) {
          this.hideLoadMoreButton();
        }
      }, itemsToShow.length * 100 + 300);
      
    }, 500);
  }
  
  updateLoadMoreVisibility() {
    if (!this.loadMoreEnabled) return;
    
    const hiddenItems = this.filteredItems.filter(item => 
      item.classList.contains('arvidsson-shop-by-room__item--hidden')
    );
    
    if (hiddenItems.length > 0) {
      this.showLoadMoreButton();
    } else {
      this.hideLoadMoreButton();
    }
  }
  
  showLoadMoreButton() {
    if (this.loadMoreBtn) {
      this.loadMoreBtn.style.display = 'flex';
    }
  }
  
  hideLoadMoreButton() {
    if (this.loadMoreBtn) {
      this.loadMoreBtn.style.display = 'none';
    }
  }
  
  handleKeyboard(e) {
    const focusedItem = document.activeElement.closest('.arvidsson-shop-by-room__item');
    if (!focusedItem) return;
    
    const currentIndex = Array.from(this.items).indexOf(focusedItem);
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, this.items.length - 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        // Calculate grid columns based on current layout
        const itemWidth = focusedItem.offsetWidth;
        const containerWidth = this.grid.offsetWidth;
        const columns = Math.floor(containerWidth / itemWidth);
        newIndex = Math.min(currentIndex + columns, this.items.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const itemWidthUp = focusedItem.offsetWidth;
        const containerWidthUp = this.grid.offsetWidth;
        const columnsUp = Math.floor(containerWidthUp / itemWidthUp);
        newIndex = Math.max(currentIndex - columnsUp, 0);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.handleItemClick(e, focusedItem);
        break;
    }
    
    if (newIndex !== currentIndex) {
      const targetItem = this.items[newIndex];
      const targetLink = targetItem.querySelector('.arvidsson-shop-by-room__link');
      if (targetLink) {
        targetLink.focus();
      } else {
        targetItem.focus();
      }
    }
  }
  
  handleResize() {
    // Recalculate any layout-dependent features
    if (this.animateOnScroll && this.observer) {
      // Re-observe items that might have changed position
      this.items.forEach(item => {
        if (!item.classList.contains('arvidsson-shop-by-room__item--visible')) {
          this.observer.observe(item);
        }
      });
    }
  }
  
  // Public methods
  filterBy(category) {
    const filter = Array.from(this.filters).find(f => f.dataset.filter === category);
    if (filter) {
      this.handleFilterClick(new Event('click'), filter);
    }
  }
  
  showAll() {
    this.filterBy('all');
  }
  
  loadAllItems() {
    while (this.filteredItems.some(item => item.classList.contains('arvidsson-shop-by-room__item--hidden'))) {
      this.loadMore();
    }
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Shop by Room Manager
 * Handles multiple shop by room instances
 */
class ArvidssomShopByRoomManager {
  constructor() {
    this.instances = new Map();
    this.init();
  }
  
  init() {
    this.initializeInstances();
    this.bindGlobalEvents();
  }
  
  initializeInstances() {
    const sections = document.querySelectorAll('[data-section-type="shop-by-room"]');
    
    sections.forEach(section => {
      const id = section.dataset.sectionId || section.id;
      if (id && !this.instances.has(id)) {
        const instance = new ArvidssomShopByRoom(section);
        this.instances.set(id, instance);
      }
    });
  }
  
  bindGlobalEvents() {
    // Theme editor events
    document.addEventListener('shopify:section:load', (e) => {
      if (e.detail.sectionId && e.target.dataset.sectionType === 'shop-by-room') {
        this.initializeInstance(e.target);
      }
    });
    
    document.addEventListener('shopify:section:unload', (e) => {
      if (e.detail.sectionId) {
        this.destroyInstance(e.detail.sectionId);
      }
    });
  }
  
  initializeInstance(element) {
    const id = element.dataset.sectionId || element.id;
    if (id) {
      const instance = new ArvidssomShopByRoom(element);
      this.instances.set(id, instance);  
    }
  }
  
  destroyInstance(id) {
    const instance = this.instances.get(id);
    if (instance) {
      instance.destroy();
      this.instances.delete(id);
    }
  }
  
  getInstance(id) {
    return this.instances.get(id);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomShopByRoomManager = new ArvidssomShopByRoomManager();
  window.arvidssomShopByRooms = window.arvidssomShopByRoomManager.instances;
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.arvidssomShopByRoomManager = new ArvidssomShopByRoomManager();
    window.arvidssomShopByRooms = window.arvidssomShopByRoomManager.instances;
  });
} else {
  window.arvidssomShopByRoomManager = new ArvidssomShopByRoomManager();
  window.arvidssomShopByRooms = window.arvidssomShopByRoomManager.instances;
}