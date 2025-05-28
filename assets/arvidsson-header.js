/**
 * Arvidsson Header Module JavaScript
 * Handles mobile navigation, sticky header, and interactive features
 */

class ArvidssomHeader {
  constructor() {
    this.header = document.getElementById('header');
    this.mobileToggle = document.querySelector('.arvidsson-header__mobile-toggle');
    this.mobileNav = document.getElementById('mobile-nav');
    this.mobileOverlay = document.getElementById('mobile-overlay');
    this.mobileMenuItems = document.querySelectorAll('.arvidsson-header__mobile-item');
    this.searchInputs = document.querySelectorAll('.arvidsson-header__search-input');
    this.cartCount = document.getElementById('cart-count');
    
    this.isScrolled = false;
    this.isMobileMenuOpen = false;
    this.lastScrollTop = 0;
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.handleScroll();
    this.updateCartCount();
  }
  
  bindEvents() {
    // Mobile menu toggle
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
    }
    
    // Mobile overlay click
    if (this.mobileOverlay) {
      this.mobileOverlay.addEventListener('click', () => this.closeMobileMenu());
    }
    
    // Mobile submenu toggles
    this.mobileMenuItems.forEach(item => {
      const link = item.querySelector('.arvidsson-header__mobile-link');
      const submenu = item.querySelector('.arvidsson-header__mobile-submenu');
      
      if (link && submenu) {
        link.addEventListener('click', (e) => {
          // Only prevent default if it's a parent menu item
          if (submenu.children.length > 0) {
            e.preventDefault();
            this.toggleMobileSubmenu(item);
          }
        });
      }
    });
    
    // Scroll events
    window.addEventListener('scroll', () => this.handleScroll());
    
    // Resize events
    window.addEventListener('resize', () => this.handleResize());
    
    // Search functionality
    this.searchInputs.forEach(input => {
      input.addEventListener('focus', () => this.handleSearchFocus(input));
      input.addEventListener('blur', () => this.handleSearchBlur(input));
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Cart updates (listen for Shopify cart events)
    document.addEventListener('cart:updated', (e) => this.updateCartCount(e.detail));
  }
  
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    if (this.isMobileMenuOpen) {
      this.openMobileMenu();
    } else {
      this.closeMobileMenu();
    }
  }
  
  openMobileMenu() {
    this.isMobileMenuOpen = true;
    this.mobileToggle.classList.add('is-active');
    this.mobileToggle.setAttribute('aria-expanded', 'true');
    this.mobileNav.classList.add('is-open');
    this.mobileOverlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    
    // Focus first menu item for accessibility
    const firstMenuItem = this.mobileNav.querySelector('.arvidsson-header__mobile-link');
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 300);
    }
  }
  
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.mobileToggle.classList.remove('is-active');
    this.mobileToggle.setAttribute('aria-expanded', 'false');
    this.mobileNav.classList.remove('is-open');
    this.mobileOverlay.classList.remove('is-visible');
    document.body.style.overflow = '';
    
    // Close all submenus
    this.mobileMenuItems.forEach(item => {
      item.classList.remove('is-open');
    });
  }
  
  toggleMobileSubmenu(item) {
    const isOpen = item.classList.contains('is-open');
    
    // Close all other submenus
    this.mobileMenuItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove('is-open');
      }
    });
    
    // Toggle current submenu
    item.classList.toggle('is-open', !isOpen);
  }
  
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Sticky header with shadow
    if (scrollTop > 60 && !this.isScrolled) {
      this.isScrolled = true;
      this.header.classList.add('is-scrolled');
    } else if (scrollTop <= 60 && this.isScrolled) {
      this.isScrolled = false;
      this.header.classList.remove('is-scrolled');
    }
    
    this.lastScrollTop = scrollTop;
  }
  
  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth >= 1024 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
  
  handleSearchFocus(input) {
    const wrapper = input.closest('.arvidsson-header__search-wrapper');
    if (wrapper) {
      wrapper.classList.add('is-focused');
    }
  }
  
  handleSearchBlur(input) {
    const wrapper = input.closest('.arvidsson-header__search-wrapper');
    if (wrapper) {
      wrapper.classList.remove('is-focused');
    }
  }
  
  handleKeyboard(e) {
    // Close mobile menu with Escape key
    if (e.key === 'Escape' && this.isMobileMenuOpen) {
      this.closeMobileMenu();
      this.mobileToggle.focus();
    }
    
    // Navigate through mobile menu with arrow keys
    if (this.isMobileMenuOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      this.navigateMobileMenu(e);
    }
  }
  
  navigateMobileMenu(e) {
    const focusedElement = document.activeElement;
    const menuLinks = Array.from(this.mobileNav.querySelectorAll('a'));
    const currentIndex = menuLinks.indexOf(focusedElement);
    
    if (currentIndex === -1) return;
    
    e.preventDefault();
    
    let nextIndex;
    if (e.key === 'ArrowDown') {
      nextIndex = currentIndex + 1 >= menuLinks.length ? 0 : currentIndex + 1;
    } else {
      nextIndex = currentIndex - 1 < 0 ? menuLinks.length - 1 : currentIndex - 1;
    }
    
    menuLinks[nextIndex].focus();
  }
  
  updateCartCount(cartData) {
    if (this.cartCount) {
      const count = cartData ? cartData.item_count : window.Shopify?.cart?.item_count || 0;
      this.cartCount.textContent = count;
      this.cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
  }
  
  // Public method to update cart count from external calls
  static updateCart(cartData) {
    const instance = window.arvidssomHeader;
    if (instance) {
      instance.updateCartCount(cartData);
    }
  }
}

/**
 * Search Enhancement
 * Adds predictive search functionality
 */
class ArvidssomSearch {
  constructor() {
    this.searchInputs = document.querySelectorAll('.arvidsson-header__search-input');
    this.searchResults = null;
    this.debounceTimer = null;
    this.isLoading = false;
    
    this.init();
  }
  
  init() {
    this.searchInputs.forEach(input => {
      input.addEventListener('input', (e) => this.handleInput(e));
      input.addEventListener('keydown', (e) => this.handleKeydown(e));
    });
  }
  
  handleInput(e) {
    const query = e.target.value.trim();
    
    clearTimeout(this.debounceTimer);
    
    if (query.length < 2) {
      this.hideResults();
      return;
    }
    
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query, e.target);
    }, 300);
  }
  
  handleKeydown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.navigateResults(e.key);
    } else if (e.key === 'Enter' && this.getSelectedResult()) {
      e.preventDefault();
      this.selectResult();
    } else if (e.key === 'Escape') {
      this.hideResults();
      e.target.blur();
    }
  }
  
  async performSearch(query, input) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      const response = await fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6`);
      const data = await response.json();
      
      this.showResults(data.resources.results.products, input);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  showResults(products, input) {
    this.hideResults();
    
    if (!products || products.length === 0) return;
    
    const wrapper = input.closest('.arvidsson-header__search-wrapper');
    
    this.searchResults = document.createElement('div');
    this.searchResults.className = 'arvidsson-header__search-results';
    
    const resultsHtml = products.map(product => `
      <a href="${product.url}" class="arvidsson-header__search-result">
        <img src="${product.featured_image}" alt="${product.title}" class="arvidsson-header__search-result-image">
        <div class="arvidsson-header__search-result-content">
          <span class="arvidsson-header__search-result-title">${product.title}</span>
          <span class="arvidsson-header__search-result-price">${this.formatPrice(product.price)}</span>
        </div>
      </a>
    `).join('');
    
    this.searchResults.innerHTML = resultsHtml + `
      <a href="/search?q=${encodeURIComponent(input.value)}" class="arvidsson-header__search-all">
        Visa alla resultat
      </a>
    `;
    
    wrapper.appendChild(this.searchResults);
    
    // Add styles dynamically if not already added
    if (!document.getElementById('search-results-styles')) {
      const styles = document.createElement('style');
      styles.id = 'search-results-styles';
      styles.textContent = `
        .arvidsson-header__search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          z-index: 1000;
          margin-top: 4px;
          max-height: 400px;
          overflow-y: auto;
        }
        .arvidsson-header__search-result {
          display: flex;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid var(--color-border);
          text-decoration: none;
          color: var(--color-text);
          transition: background-color var(--transition-base);
          gap: 12px;
        }
        .arvidsson-header__search-result:hover {
          background-color: var(--color-background-alt);
        }
        .arvidsson-header__search-result-image {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .arvidsson-header__search-result-title {
          font-weight: var(--font-weight-semibold);
          font-size: 14px;
        }
        .arvidsson-header__search-result-price {
          color: var(--color-primary);
          font-weight: var(--font-weight-semibold);
          font-size: 12px;
        }
        .arvidsson-header__search-all {
          display: block;
          padding: 12px;
          text-align: center;
          color: var(--color-primary);
          font-weight: var(--font-weight-semibold);
          text-decoration: none;
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  hideResults() {
    if (this.searchResults) {
      this.searchResults.remove();
      this.searchResults = null;
    }
  }
  
  formatPrice(price) {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(price / 100);
  }
  
  getSelectedResult() {
    if (!this.searchResults) return null;
    return this.searchResults.querySelector('.arvidsson-header__search-result.selected');
  }
  
  navigateResults(direction) {
    if (!this.searchResults) return;
    
    const results = this.searchResults.querySelectorAll('.arvidsson-header__search-result, .arvidsson-header__search-all');
    const selected = this.searchResults.querySelector('.selected');
    
    let newIndex = 0;
    if (selected) {
      const currentIndex = Array.from(results).indexOf(selected);
      if (direction === 'ArrowDown') {
        newIndex = currentIndex + 1 >= results.length ? 0 : currentIndex + 1;
      } else {
        newIndex = currentIndex - 1 < 0 ? results.length - 1 : currentIndex - 1;
      }
    }
    
    results.forEach(result => result.classList.remove('selected'));
    results[newIndex].classList.add('selected');
  }
  
  selectResult() {
    const selected = this.getSelectedResult();
    if (selected) {
      window.location.href = selected.href;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arvidssomHeader = new ArvidssomHeader();
  window.arvidssomSearch = new ArvidssomSearch();
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.arvidssomHeader = new ArvidssomHeader();
    window.arvidssomSearch = new ArvidssomSearch();
  });
} else {
  window.arvidssomHeader = new ArvidssomHeader();
  window.arvidssomSearch = new ArvidssomSearch();
}
