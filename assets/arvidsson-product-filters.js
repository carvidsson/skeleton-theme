/**
 * Arvidsson Product Filters Module JavaScript
 * Handles all filtering functionality, URL updates, and UI interactions
 */

class ArvidssomProductFilters {
  constructor() {
    this.container = document.querySelector('.arvidsson-product-filters');
    if (!this.container) return;
    
    // Filter elements
    this.quickFilters = document.querySelectorAll('.arvidsson-product-filters__quick-btn');
    this.advancedToggle = document.getElementById('advanced-filters-toggle');
    this.advancedPanel = document.getElementById('advanced-filters-panel');
    this.filterCheckboxes = document.querySelectorAll('[data-filter-checkbox]');
    this.priceInputs = {
      min: document.getElementById('price-min'),
      max: document.getElementById('price-max'),
      rangeMin: document.getElementById('price-range-min'),
      rangeMax: document.getElementById('price-range-max')
    };
    this.searchInputs = document.querySelectorAll('[data-search-type]');
    
    // Action elements
    this.applyButton = document.getElementById('apply-filters');
    this.clearButton = document.getElementById('clear-filters');
    this.clearAllButton = document.getElementById('clear-all-filters');
    this.clearAllActiveButton = document.getElementById('clear-all-active');
    
    // Display elements
    this.activeFiltersContainer = document.getElementById('active-filters');
    this.activeFiltersList = document.getElementById('active-filters-list');
    this.activeCountElement = document.querySelector('.arvidsson-product-filters__active-count');
    this.applyCountElement = document.querySelector('.arvidsson-product-filters__apply-count');
    
    // State
    this.activeFilters = this.parseUrlFilters();
    this.tempFilters = { ...this.activeFilters };
    this.isAdvancedOpen = false;
    this.debounceTimer = null;
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.initializePriceRange();
    this.initializeSearchFilters();
    this.updateUI();
    this.updateActiveFiltersDisplay();
  }
  
  bindEvents() {
    // Quick filters
    this.quickFilters.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleQuickFilter(e));
    });
    
    // Advanced filters toggle
    if (this.advancedToggle) {
      this.advancedToggle.addEventListener('click', () => this.toggleAdvancedFilters());
    }
    
    // Filter checkboxes
    this.filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => this.handleCheckboxFilter(e));
    });
    
    // Price range inputs
    Object.values(this.priceInputs).forEach(input => {
      if (input) {
        input.addEventListener('input', () => this.handlePriceChange());
      }
    });
    
    // Search inputs
    this.searchInputs.forEach(input => {
      input.addEventListener('input', (e) => this.handleSearchFilter(e));
    });
    
    // Action buttons
    if (this.applyButton) {
      this.applyButton.addEventListener('click', () => this.applyFilters());
    }
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => this.clearAdvancedFilters());
    }
    if (this.clearAllButton) {
      this.clearAllButton.addEventListener('click', () => this.clearAllFilters());
    }
    if (this.clearAllActiveButton) {
      this.clearAllActiveButton.addEventListener('click', () => this.clearAllFilters());
    }
    
    // URL changes (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.activeFilters = this.parseUrlFilters();
      this.tempFilters = { ...this.activeFilters };
      this.updateUI();
      this.updateActiveFiltersDisplay();
      this.filterProducts();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isAdvancedOpen) {
        this.toggleAdvancedFilters();
      }
    });
  }
  
  handleQuickFilter(e) {
    const button = e.target;
    const filterType = button.dataset.filterType;
    const filterValue = button.dataset.filterValue;
    
    // Remove active class from siblings
    const siblings = button.parentElement.querySelectorAll('.arvidsson-product-filters__quick-btn');
    siblings.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    button.classList.add('active');
    
    // Update filters
    if (filterValue === '') {
      delete this.activeFilters[filterType];
    } else {
      this.activeFilters[filterType] = [filterValue];
    }
    
    this.tempFilters = { ...this.activeFilters };
    this.updateActiveFiltersDisplay();
    this.updateAdvancedFiltersFromActive();
    this.applyFilters();
  }
  
  handleCheckboxFilter(e) {
    const checkbox = e.target;
    const filterType = checkbox.name;
    const filterValue = checkbox.value;
    
    if (!this.tempFilters[filterType]) {
      this.tempFilters[filterType] = [];
    }
    
    if (checkbox.checked) {
      if (!this.tempFilters[filterType].includes(filterValue)) {
        this.tempFilters[filterType].push(filterValue);
      }
    } else {
      this.tempFilters[filterType] = this.tempFilters[filterType].filter(v => v !== filterValue);
      if (this.tempFilters[filterType].length === 0) {
        delete this.tempFilters[filterType];
      }
    }
    
    this.updateFilterCounts();
  }
  
  handlePriceChange() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const minPrice = this.priceInputs.min?.value || '';
      const maxPrice = this.priceInputs.max?.value || '';
      
      if (minPrice || maxPrice) {
        this.tempFilters.price = [`${minPrice}-${maxPrice}`];
      } else {
        delete this.tempFilters.price;
      }
      
      // Sync range sliders
      if (this.priceInputs.rangeMin && minPrice) {
        this.priceInputs.rangeMin.value = minPrice;
      }
      if (this.priceInputs.rangeMax && maxPrice) {
        this.priceInputs.rangeMax.value = maxPrice;
      }
      
      this.updateFilterCounts();
    }, 300);
  }
  
  handleSearchFilter(e) {
    const input = e.target;
    const searchType = input.dataset.searchType;
    const searchValue = input.value.toLowerCase();
    
    const checkboxList = input.closest('.arvidsson-product-filters__group')
                              .querySelector('.arvidsson-product-filters__checkbox-list');
    
    if (checkboxList) {
      const checkboxes = checkboxList.querySelectorAll('.arvidsson-product-filters__checkbox');
      
      checkboxes.forEach(checkbox => {
        const text = checkbox.querySelector('.arvidsson-product-filters__checkbox-text').textContent.toLowerCase();
        checkbox.style.display = text.includes(searchValue) ? 'flex' : 'none';
      });
    }
  }
  
  toggleAdvancedFilters() {
    this.isAdvancedOpen = !this.isAdvancedOpen;
    
    if (this.isAdvancedOpen) {
      this.openAdvancedFilters();
    } else {
      this.closeAdvancedFilters();
    }
  }
  
  openAdvancedFilters() {
    this.isAdvancedOpen = true;
    this.advancedToggle.setAttribute('aria-expanded', 'true');
    this.advancedPanel.setAttribute('aria-hidden', 'false');
    this.advancedPanel.classList.add('is-open');
    
    // Focus first filter input
    const firstInput = this.advancedPanel.querySelector('input, button');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
  
  closeAdvancedFilters() {
    this.isAdvancedOpen = false;
    this.advancedToggle.setAttribute('aria-expanded', 'false');
    this.advancedPanel.setAttribute('aria-hidden', 'true');
    this.advancedPanel.classList.remove('is-open');
  }
  
  applyFilters() {
    this.activeFilters = { ...this.tempFilters };
    this.updateUrl();
    this.updateActiveFiltersDisplay();
    this.updateQuickFiltersFromActive();
    this.filterProducts();
    
    // Close advanced filters on mobile after applying
    if (window.innerWidth < 768) {
      this.closeAdvancedFilters();
    }
  }
  
  clearAdvancedFilters() {
    this.tempFilters = {};
    this.updateAdvancedFilterUI();
    this.updateFilterCounts();
  }
  
  clearAllFilters() {
    this.activeFilters = {};
    this.tempFilters = {};
    this.updateUrl();
    this.updateUI();
    this.updateActiveFiltersDisplay();
    this.filterProducts();
  }
  
  clearSingleFilter(filterType, filterValue = null) {
    if (filterValue && this.activeFilters[filterType]) {
      this.activeFilters[filterType] = this.activeFilters[filterType].filter(v => v !== filterValue);
      if (this.activeFilters[filterType].length === 0) {
        delete this.activeFilters[filterType];
      }
    } else {
      delete this.activeFilters[filterType];
    }
    
    this.tempFilters = { ...this.activeFilters };
    this.updateUrl();
    this.updateUI();
    this.updateActiveFiltersDisplay();
    this.filterProducts();
  }
  
  async filterProducts() {
    const productGrid = document.querySelector('.arvidsson-product-grid__grid');
    const loadingElement = document.getElementById('grid-loading');
    
    if (!productGrid) return;
    
    try {
      // Show loading state
      if (loadingElement) {
        loadingElement.style.display = 'flex';
      }
      productGrid.style.opacity = '0.5';
      
      // Build filter URL
      const url = this.buildFilterUrl();
      
      // Fetch filtered products
      const response = await fetch(url, {
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
          productGrid.innerHTML = newGrid.innerHTML;
          
          // Trigger product grid reinitialization
          if (window.arvidssomProductGrid) {
            window.arvidssomProductGrid.initializeStars();
            window.arvidssomProductGrid.updateWishlistStates();
            window.arvidssomProductGrid.updateCompareStates();
            window.arvidssomProductGrid.initializeVariantSwatches();
          }
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
        
      } else {
        throw new Error('Failed to filter products');
      }
    } catch (error) {
      console.error('Filter error:', error);
      this.showError('Kunde inte filtrera produkter. Försök igen.');
    } finally {
      // Hide loading state
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      productGrid.style.opacity = '1';
    }
  }
  
  buildFilterUrl() {
    const url = new URL(window.location);
    
    // Clear existing filter parameters
    const keysToRemove = ['type', 'vendor', 'price', 'availability', 'color', 'size', 'material', 'room'];
    keysToRemove.forEach(key => url.searchParams.delete(key));
    
    // Add active filters
    Object.entries(this.activeFilters).forEach(([type, values]) => {
      if (Array.isArray(values)) {
        values.forEach(value => {
          if (type === 'price') {
            // Handle price range format
            const [min, max] = value.split('-');
            if (min) url.searchParams.append('price_min', min);
            if (max && max !== '+') url.searchParams.append('price_max', max);
          } else {
            url.searchParams.append(type, value);
          }
        });
      }
    });
    
    return url.toString();
  }
  
  updateUrl() {
    const url = this.buildFilterUrl();
    window.history.pushState({}, '', url);
  }
  
  parseUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const filters = {};
    
    // Standard filters
    ['type', 'vendor', 'availability', 'color', 'size', 'material', 'room'].forEach(key => {
      const values = params.getAll(key);
      if (values.length > 0) {
        filters[key] = values;
      }
    });
    
    // Price filter
    const priceMin = params.get('price_min');
    const priceMax = params.get('price_max');
    if (priceMin || priceMax) {
      filters.price = [`${priceMin || ''}-${priceMax || ''}`];
    }
    
    return filters;
  }
  
  updateUI() {
    this.updateQuickFiltersFromActive();
    this.updateAdvancedFiltersFromActive();
    this.updateFilterCounts();
  }
  
  updateQuickFiltersFromActive() {
    this.quickFilters.forEach(btn => {
      const filterType = btn.dataset.filterType;
      const filterValue = btn.dataset.filterValue;
      
      btn.classList.remove('active');
      
      if (filterValue === '' && !this.activeFilters[filterType]) {
        btn.classList.add('active');
      } else if (this.activeFilters[filterType] && this.activeFilters[filterType].includes(filterValue)) {
        btn.classList.add('active');
      }
    });
  }
  
  updateAdvancedFiltersFromActive() {
    // Update checkboxes
    this.filterCheckboxes.forEach(checkbox => {
      const filterType = checkbox.name;
      const filterValue = checkbox.value;
      
      checkbox.checked = this.activeFilters[filterType] && this.activeFilters[filterType].includes(filterValue);
    });
    
    // Update price inputs
    if (this.activeFilters.price && this.activeFilters.price[0]) {
      const [min, max] = this.activeFilters.price[0].split('-');
      if (this.priceInputs.min) this.priceInputs.min.value = min || '';
      if (this.priceInputs.max) this.priceInputs.max.value = max || '';
      if (this.priceInputs.rangeMin) this.priceInputs.rangeMin.value = min || 0;
      if (this.priceInputs.rangeMax) this.priceInputs.rangeMax.value = max || 10000;
    } else {
      Object.values(this.priceInputs).forEach(input => {
        if (input) input.value = '';
      });
    }
    
    this.tempFilters = { ...this.activeFilters };
  }
  
  updateAdvancedFilterUI() {
    // Update checkboxes from temp filters
    this.filterCheckboxes.forEach(checkbox => {
      const filterType = checkbox.name;
      const filterValue = checkbox.value;
      
      checkbox.checked = this.tempFilters[filterType] && this.tempFilters[filterType].includes(filterValue);
    });
    
    // Update price inputs from temp filters
    if (this.tempFilters.price && this.tempFilters.price[0]) {
      const [min, max] = this.tempFilters.price[0].split('-');
      if (this.priceInputs.min) this.priceInputs.min.value = min || '';
      if (this.priceInputs.max) this.priceInputs.max.value = max || '';
    } else {
      if (this.priceInputs.min) this.priceInputs.min.value = '';
      if (this.priceInputs.max) this.priceInputs.max.value = '';
    }
  }
  
  updateFilterCounts() {
    const tempFilterCount = Object.keys(this.tempFilters).length;
    const activeFilterCount = Object.keys(this.activeFilters).length;
    
    // Update apply button count
    if (this.applyCountElement) {
      if (tempFilterCount > 0) {
        this.applyCountElement.textContent = tempFilterCount;
        this.applyCountElement.style.display = 'inline-flex';
      } else {
        this.applyCountElement.style.display = 'none';
      }
    }
    
    // Update active count in toggle
    if (this.activeCountElement) {
      if (activeFilterCount > 0) {
        this.activeCountElement.textContent = activeFilterCount;
        this.activeCountElement.style.display = 'flex';
      } else {
        this.activeCountElement.style.display = 'none';
      }
    }
    
    // Show/hide clear all button
    if (this.clearAllButton) {
      this.clearAllButton.style.display = activeFilterCount > 0 ? 'block' : 'none';
    }
  }
  
  updateActiveFiltersDisplay() {
    if (!this.activeFiltersList) return;
    
    const filterCount = Object.keys(this.activeFilters).length;
    
    if (filterCount === 0) {
      this.activeFiltersContainer.style.display = 'none';
      return;
    }
    
    this.activeFiltersContainer.style.display = 'block';
    this.activeFiltersList.innerHTML = '';
    
    Object.entries(this.activeFilters).forEach(([type, values]) => {
      values.forEach(value => {
        const tag = this.createActiveFilterTag(type, value);
        this.activeFiltersList.appendChild(tag);
      });
    });
  }
  
  createActiveFilterTag(type, value) {
    const tag = document.createElement('div');
    tag.className = 'arvidsson-product-filters__active-tag';
    
    const label = this.getFilterLabel(type, value);
    
    tag.innerHTML = `
      <span>${label}</span>
      <button class="arvidsson-product-filters__active-tag-remove" 
              aria-label="Ta bort filter: ${label}"
              data-filter-type="${type}" 
              data-filter-value="${value}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    
    // Add click handler for remove button
    const removeBtn = tag.querySelector('.arvidsson-product-filters__active-tag-remove');
    removeBtn.addEventListener('click', () => {
      this.clearSingleFilter(type, value);
    });
    
    return tag;
  }
  
  getFilterLabel(type, value) {
    const labels = {
      type: 'Typ',
      vendor: 'Märke',
      price: 'Pris',
      availability: 'Tillgänglighet',
      color: 'Färg',
      size: 'Storlek',
      material: 'Material',
      room: 'Rum'
    };
    
    let displayValue = value;
    
    // Format specific filter types
    if (type === 'price') {
      const [min, max] = value.split('-');
      if (min && max && max !== '+') {
        displayValue = `${min}-${max} kr`;
      } else if (min) {
        displayValue = `Från ${min} kr`;
      } else if (max && max !== '+') {
        displayValue = `Till ${max} kr`;
      }
    } else if (value.includes('-')) {
      // Remove prefix from tag-based filters
      displayValue = value.split('-').slice(1).join('-');
    }
    
    return `${labels[type] || type}: ${displayValue}`;
  }
  
  initializePriceRange() {
    if (!this.priceInputs.rangeMin || !this.priceInputs.rangeMax) return;
    
    // Sync range sliders with number inputs
    this.priceInputs.rangeMin.addEventListener('input', () => {
      if (this.priceInputs.min) {
        this.priceInputs.min.value = this.priceInputs.rangeMin.value;
      }
      this.handlePriceChange();
    });
    
    this.priceInputs.rangeMax.addEventListener('input', () => {
      if (this.priceInputs.max) {
        this.priceInputs.max.value = this.priceInputs.rangeMax.value;
      }
      this.handlePriceChange();
    });
    
    // Prevent min from being greater than max
    this.priceInputs.rangeMin.addEventListener('input', () => {
      const minVal = parseInt(this.priceInputs.rangeMin.value);
      const maxVal = parseInt(this.priceInputs.rangeMax.value);
      
      if (minVal > maxVal) {
        this.priceInputs.rangeMax.value = minVal;
        if (this.priceInputs.max) {
          this.priceInputs.max.value = minVal;
        }
      }
    });
  }
  
  initializeSearchFilters() {
    // Set up checkbox list max heights
    document.querySelectorAll('[data-max-height]').forEach(list => {
      const maxHeight = list.dataset.maxHeight;
      list.style.maxHeight = `${maxHeight}px`;
    });
  }
  
  showError(message) {
    // Create and show error notification
    const notification = document.createElement('div');
    notification.className = 'arvidsson-filters-error';
    notification.innerHTML = `
      <div class="arvidsson-filters-error__content">
        <span>${message}</span>
        <button class="arvidsson-filters-error__close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
    
    // Close button
    notification.querySelector('.arvidsson-filters-error__close').addEventListener('click', () => {
      notification.remove();
    });
  }
  
  // Public methods
  static getActiveFilters() {
    const instance = window.arvidssomProductFilters;
    return instance ? instance.activeFilters : {};
  }
  
  static clearAllFilters() {
    const instance = window.arvidssomProductFilters;
    if (instance) {
      instance.clearAllFilters();
    }
  }
  
  static applyFilter(type, value) {
    const instance = window.arvidssomProductFilters;
    if (instance) {
      if (!instance.activeFilters[type]) {
        instance.activeFilters[type] = [];
      }
      if (!instance.activeFilters[type].includes(value)) {
        instance.activeFilters[type].push(value);
      }
      instance.tempFilters = { ...instance.activeFilters };
      instance.applyFilters();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.arvidsson-product-filters')) {
    window.arvidssomProductFilters = new ArvidssomProductFilters();
  }
});

// CSS for error notifications (injected dynamically)
const errorStyles = `
  .arvidsson-filters-error {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-left: 4px solid #ef4444;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  }
  
  .arvidsson-filters-error__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    gap: 12px;
    color: #dc2626;
  }
  
  .arvidsson-filters-error__close {
    background: none;
    border: none;
    color: #dc2626;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
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
    .arvidsson-filters-error {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
`;

// Inject error styles
if (!document.getElementById('arvidsson-filters-error-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'arvidsson-filters-error-styles';
  styleSheet.textContent = errorStyles;
  document.head.appendChild(styleSheet);
}
