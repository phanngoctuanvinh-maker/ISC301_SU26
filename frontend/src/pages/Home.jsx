import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';



function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Banner Slider States
  const [banners, setBanners] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderTimer = useRef(null);

  // Scroll refs for each pill row
  const catScrollRef = useRef(null);
  const brandScrollRef = useRef(null);

  const scrollPills = (ref, dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  // Search & Filter States
  const [searchVal, setSearchVal] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategory, setExpandedCategory] = useState('');

  // Sidebar Filter States
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempSize, setTempSize] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const [portalTarget, setPortalTarget] = useState(null);
  const [searchPortalTarget, setSearchPortalTarget] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('navbar-category-portal'));
    setSearchPortalTarget(document.getElementById('navbar-search-portal'));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if it's clicking on the category trigger button itself to avoid double toggling
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const trigger = document.querySelector('.nav-category-trigger-btn');
        if (trigger && trigger.contains(event.target)) {
          return;
        }
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchBanners();
    fetchCatalogs();

    const handleLogoClick = (e) => {
      const logo = e.target.closest('.logo-text');
      if (logo) {
        handleClearFilters();
      }
    };
    document.addEventListener('click', handleLogoClick);
    return () => document.removeEventListener('click', handleLogoClick);
  }, []);

  // Auto-play banner slider
  useEffect(() => {
    if (banners.length <= 1) return;
    sliderTimer.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(sliderTimer.current);
  }, [banners.length]);

  const goToSlide = (index) => {
    clearInterval(sliderTimer.current);
    setActiveSlide(index);
    if (banners.length > 1) {
      sliderTimer.current = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % banners.length);
      }, 5000);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await api.get('/banners');
      setBanners(res.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchProducts();
  }, [activeSearch, selectedCategory, selectedBrand, selectedGender, selectedSort, currentPage, minPrice, maxPrice, selectedSize]);

  const fetchCatalogs = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories', { params: { _t: Date.now() } }),
        api.get('/brands', { params: { _t: Date.now() } })
      ]);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
    } catch (err) {
      console.error('Error fetching catalogs:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: currentPage,
        limit: 8
      };

      if (selectedSort === 'featured') {
        params.featured = 'true';
      } else {
        params.sort = selectedSort;
      }

      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedBrand) params.brand_id = selectedBrand;
      if (selectedGender) params.gender = selectedGender;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (selectedSize) params.size = selectedSize;

      const response = await api.get('/products', { params });
      setProducts(response.data?.items || []);
      setPagination(response.data?.pagination || { page: 1, limit: 8, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchVal);
    setCurrentPage(1);
  };

  const handleCategorySelect = (id) => {
    setSelectedCategory(selectedCategory === id ? '' : id);
    setCurrentPage(1);
  };

  const handleBrandSelect = (id, event) => {
    const isDeSelecting = selectedBrand === id;
    setSelectedBrand(isDeSelecting ? '' : id);
    setSelectedGender(''); // Reset gender when brand changes
    setCurrentPage(1);
    if (!isDeSelecting && event && event.currentTarget) {
      event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleGenderSelect = (gender) => {
    setSelectedGender(selectedGender === gender ? '' : gender);
    setCurrentPage(1);
  };

  const handleSortSelect = (e) => {
    setSelectedSort(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleApplySidebarFilters = () => {
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setSelectedSize(tempSize);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setActiveSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedGender('');
    setSelectedSort('newest');
    setCurrentPage(1);
    setExpandedCategory('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempSize('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSize('');
  };

  const hasActiveFilters = activeSearch || selectedCategory || selectedBrand || selectedGender || selectedSort !== 'newest' || minPrice || maxPrice || selectedSize;

  // Flatten categories for filter bar
  const flatCategories = categories.reduce((acc, cat) => {
    acc.push(cat);
    if (cat.children) acc.push(...cat.children);
    return acc;
  }, []);

  const activeBrand = brands.find(b => b.id === selectedBrand);

  return (
    <div className="container home-page-container" style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column' }}>
      
      {/* ─── React Portal for Navbar Category Dropdown ───────────────────────── */}
      {portalTarget && createPortal(
        <div style={{ position: 'relative' }}>
          <button
            className={`nav-category-trigger-btn ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            📂 Danh mục
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="nav-category-menu" ref={dropdownRef}>
              <button
                className={`nav-category-item ${!selectedCategory ? 'active' : ''}`}
                onClick={() => {
                  handleCategorySelect('');
                  setExpandedCategory('');
                  setIsDropdownOpen(false);
                }}
              >
                Tất cả sản phẩm
              </button>
              {categories.map((cat) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const isExpanded = expandedCategory === cat.id;
                const isSelected = selectedCategory === cat.id;
                return (
                  <div key={cat.id} className="nav-category-group">
                    <button
                      className={`nav-category-item ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        handleCategorySelect(cat.id);
                        if (hasChildren) {
                          setExpandedCategory(isExpanded ? '' : cat.id);
                        } else {
                          setIsDropdownOpen(false);
                        }
                      }}
                    >
                      <span>{cat.name}</span>
                      {hasChildren && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      )}
                    </button>
                    {hasChildren && isExpanded && (
                      <div className="nav-subcategory-list">
                        {cat.children.map((child) => (
                          <button
                            key={child.id}
                            className={`nav-subcategory-item ${selectedCategory === child.id ? 'active' : ''}`}
                            onClick={() => {
                              handleCategorySelect(child.id);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>,
        portalTarget
      )}

      {/* ─── React Portal for Navbar Search Bar ─────────────────────────────── */}
      {searchPortalTarget && createPortal(
        <form onSubmit={handleSearchSubmit} className="filter-search-form" style={{ margin: 0, width: '100%', maxWidth: '400px' }}>
          <span className="filter-search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input type="text" className="filter-search-input" placeholder="Tìm sản phẩm..." value={searchVal} onChange={e => setSearchVal(e.target.value)} />
          {searchVal && (
            <button type="button" className="filter-search-clear" onClick={() => { setSearchVal(''); setActiveSearch(''); setCurrentPage(1); }}>×</button>
          )}
        </form>,
        searchPortalTarget
      )}

      {/* ─── Premium Brands Bar (under header) ────────────────────────────────── */}
      <div className="brands-bar-under-header">
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <span className="brands-bar-label" style={{ minWidth: '90px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Thương hiệu
          </span>
          <div className="filter-scroll-container">
            <button className="filter-scroll-btn left" onClick={() => scrollPills(brandScrollRef, -1)} aria-label="Cuộn trái">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="filter-pills-track" ref={brandScrollRef}>
              <button 
                className={`filter-pill brand ${!selectedBrand ? 'active' : ''}`} 
                onClick={(e) => handleBrandSelect('', e)}
              >
                Tất cả
              </button>
              {brands.map(brand => {
                const isSelected = selectedBrand === brand.id;
                return (
                  <button 
                    key={brand.id} 
                    className={`filter-pill brand ${isSelected ? 'active' : ''}`} 
                    onClick={(e) => handleBrandSelect(brand.id, e)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {brand.logo_url && (
                      <img 
                        src={brand.logo_url} 
                        alt={brand.name} 
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          objectFit: 'contain',
                          borderRadius: '4px',
                          filter: isSelected ? 'brightness(0) invert(1)' : 'none',
                          transition: 'filter 0.2s'
                        }} 
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span>Giày {brand.name}</span>
                  </button>
                );
              })}
            </div>
            <button className="filter-scroll-btn right" onClick={() => scrollPills(brandScrollRef, 1)} aria-label="Cuộn phải">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* ─── Premium Gender/Loại Giày Bar (always visible) ──────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', borderTop: '1px dashed hsla(262, 60%, 85%, 0.2)', paddingTop: '0.75rem' }}>
          <span className="brands-bar-label" style={{ minWidth: '90px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Loại giày
          </span>
          <div className="filter-scroll-container">
            <div className="filter-pills-track">
              <button 
                className={`filter-pill gender ${!selectedGender ? 'active' : ''}`} 
                onClick={() => handleGenderSelect('')}
              >
                Tất cả
              </button>
              <button 
                className={`filter-pill gender ${selectedGender === 'male' ? 'active' : ''}`} 
                onClick={() => handleGenderSelect('male')}
              >
                ♂ Giày Nam
              </button>
              <button 
                className={`filter-pill gender ${selectedGender === 'female' ? 'active' : ''}`} 
                onClick={() => handleGenderSelect('female')}
              >
                ♀ Giày Nữ
              </button>
              <button 
                className={`filter-pill gender ${selectedGender === 'unisex' ? 'active' : ''}`} 
                onClick={() => handleGenderSelect('unisex')}
              >
                ⚡ Giày Unisex
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Banner Slider Section ─────────────────────────────────────────── */}
      {!selectedBrand && (
        banners.length > 0 ? (
          <section className="home-banner-slider">
            {/* Slides */}
            <div className="slider-track">
              {banners.map((banner, i) => (
                <div
                  key={banner.id}
                  className={`slider-slide ${i === activeSlide ? 'active' : ''}`}
                  onClick={() => {
                    if (banner.link_type === 'url' && banner.link_url) window.open(banner.link_url, '_blank');
                  }}
                  style={{ cursor: banner.link_type !== 'none' ? 'pointer' : 'default' }}
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title || `Banner ${i + 1}`}
                    className="slider-img"
                    onError={e => { e.target.src = ''; e.target.style.display = 'none'; }}
                  />
                  {banner.title && (
                    <div className="slider-caption">
                      <h2 className="slider-caption-title">{banner.title}</h2>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Arrow controls */}
            {banners.length > 1 && (
              <>
                <button
                  className="slider-arrow slider-arrow--prev"
                  onClick={() => goToSlide((activeSlide - 1 + banners.length) % banners.length)}
                  aria-label="Trước"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  className="slider-arrow slider-arrow--next"
                  onClick={() => goToSlide((activeSlide + 1) % banners.length)}
                  aria-label="Tiếp"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </>
            )}

            {/* Dots */}
            {banners.length > 1 && (
              <div className="slider-dots">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    className={`slider-dot ${i === activeSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Slide counter */}
            {banners.length > 1 && (
              <span className="slider-counter">{activeSlide + 1} / {banners.length}</span>
            )}
          </section>
        ) : (
          /* Fallback static hero nếu chưa có banner nào */
          <section className="home-hero-banner">
            <div className="home-hero-content">
              <h1 className="home-hero-title">BƯỚC CHÂN KIÊN ĐỊNH</h1>
              <p className="home-hero-subtitle">
                Khám phá bộ sưu tập giày thể thao và phụ kiện chính hãng mới nhất. Thiết kế tối ưu cho hiệu suất tập luyện và phong cách thời trang năng động hàng ngày.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 550, behavior: 'smooth' })}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2rem' }}
              >
                Mua Ngay →
              </button>
            </div>
          </section>
        )
      )}

      {/* ─── Main Layout ───────────────────────────────────────────────────── */}
      {selectedBrand ? (
        <div className="brand-page-layout">
          {/* Breadcrumb */}
          <div className="breadcrumb-nav">
            <span onClick={() => { setSelectedBrand(''); setSelectedGender(''); setCurrentPage(1); }} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Trang chủ
            </span>
            <span className="separator">/</span>
            <span className="current">Giày {activeBrand?.name} Chính Hãng</span>
          </div>

          <div className="brand-page-grid">
            {/* Left Sidebar Filter */}
            <aside className="brand-sidebar-filter">
              <div className="sidebar-header">
                <span className="sidebar-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  BỘ LỌC
                </span>
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} className="sidebar-clear-btn">Xóa lọc</button>
                )}
              </div>

              {/* Price filter section */}
              <div className="sidebar-section">
                <h4 className="section-title">Khoảng giá (VNĐ)</h4>
                <div className="price-inputs">
                  <input 
                    type="number" 
                    placeholder="Từ" 
                    className="price-input" 
                    value={tempMinPrice}
                    onChange={e => setTempMinPrice(e.target.value)}
                  />
                  <span className="price-separator">-</span>
                  <input 
                    type="number" 
                    placeholder="Đến" 
                    className="price-input" 
                    value={tempMaxPrice}
                    onChange={e => setTempMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Size filter section */}
              <div className="sidebar-section">
                <h4 className="section-title">Kích cỡ (Size)</h4>
                <div className="size-grid">
                  {['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map(size => {
                    const isSelected = tempSize === size;
                    return (
                      <button 
                        key={size} 
                        type="button"
                        className={`size-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setTempSize(isSelected ? '' : size)}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="button" onClick={handleApplySidebarFilters} className="apply-filter-btn">ÁP DỤNG BỘ LỌC</button>
            </aside>

            {/* Right main panel */}
            <main className="brand-main-panel">
              <h1 className="brand-heading-title">GIÀY {activeBrand?.name?.toUpperCase()} CHÍNH HÃNG</h1>

              {/* Brand Promo Banner */}
              <div className="brand-promo-banner">
                <div className="brand-promo-content">
                  <span className="promo-tag">COLLABORATION</span>
                  <h2>MYSHOES × {activeBrand?.name?.toUpperCase()}</h2>
                  <p>Trải nghiệm đẳng cấp thời trang và công nghệ tối ưu trên từng bước chạy</p>
                </div>
              </div>

              <div className="brand-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {/* Sort */}
                  <div className="filter-sort-wrap">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="11" y2="18"/></svg>
                    <select value={selectedSort} onChange={handleSortSelect} className="filter-sort-select">
                      <option value="newest">Mới nhất</option>
                      <option value="featured">Sản phẩm nổi bật</option>
                      <option value="popular">Bán chạy nhất</option>
                      <option value="price_asc">Giá: Thấp → Cao</option>
                      <option value="price_desc">Giá: Cao → Thấp</option>
                      <option value="name_asc">Tên: A → Z</option>
                      <option value="name_desc">Tên: Z → A</option>
                    </select>
                  </div>
                  {/* Count badge */}
                  <div className="filter-result-count">
                    <span className="filter-count-num">{pagination.total}</span> sản phẩm
                  </div>
                </div>
              </div>

              {/* Active filter chips (if any other filter is active) */}
              {hasActiveFilters && (
                <div className="filter-active-chips" style={{ border: 'none', padding: '0 0 1rem 0' }}>
                  <span className="active-chip-label">Đang lọc:</span>
                  {activeSearch && (
                    <button className="active-chip" onClick={() => { setSearchVal(''); setActiveSearch(''); setCurrentPage(1); }}>
                      🔍 "{activeSearch}" <span className="active-chip-x">×</span>
                    </button>
                  )}
                  {selectedCategory && (() => {
                    const cat = flatCategories.find(c => c.id === selectedCategory);
                    return cat ? (
                      <button className="active-chip" onClick={() => handleCategorySelect(selectedCategory)}>
                        📂 {cat.name} <span className="active-chip-x">×</span>
                      </button>
                    ) : null;
                  })()}
                  {selectedGender && (
                    <button className="active-chip" style={{ background: 'linear-gradient(135deg, hsl(280,80%,60%), hsl(187,92%,46%))' }} onClick={() => handleGenderSelect(selectedGender)}>
                      {selectedGender === 'male' ? '♂ Nam' : selectedGender === 'female' ? '♀ Nữ' : '⚡ Unisex'} <span className="active-chip-x">×</span>
                    </button>
                  )}
                  {(minPrice || maxPrice) && (
                    <button className="active-chip" style={{ background: 'linear-gradient(135deg, hsl(200,80%,45%), hsl(187,92%,46%))' }} onClick={() => { setMinPrice(''); setTempMinPrice(''); setMaxPrice(''); setTempMaxPrice(''); setCurrentPage(1); }}>
                      💵 {minPrice ? Number(minPrice).toLocaleString('vi-VN') + '₫' : '0₫'} - {maxPrice ? Number(maxPrice).toLocaleString('vi-VN') + '₫' : '∞'} <span className="active-chip-x">×</span>
                    </button>
                  )}
                  {selectedSize && (
                    <button className="active-chip" style={{ background: 'linear-gradient(135deg, hsl(150,60%,40%), hsl(187,92%,46%))' }} onClick={() => { setSelectedSize(''); setTempSize(''); setCurrentPage(1); }}>
                      📏 Size: {selectedSize} <span className="active-chip-x">×</span>
                    </button>
                  )}
                  {selectedSort === 'featured' && (
                    <button className="active-chip" style={{ background: 'linear-gradient(135deg, hsl(38,92%,45%), hsl(25,90%,55%))' }} onClick={() => { setSelectedSort('newest'); setCurrentPage(1); }}>
                      ⭐ Nổi bật <span className="active-chip-x">×</span>
                    </button>
                  )}
                </div>
              )}

              {/* Products Display */}
              <div style={{ marginBottom: '4rem' }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Đang tải danh sách sản phẩm...</h3>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger">{error}</div>
                ) : products.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 3rem', border: '1px dashed var(--glass-border)' }}>
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>Không tìm thấy sản phẩm</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                      Vui lòng đổi từ khóa hoặc xóa bớt các bộ lọc đang chọn.
                    </p>
                    <button onClick={handleClearFilters} className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}>
                      Thiết lập lại bộ lọc
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="products-display-grid">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {pagination.totalPages > 1 && (
                      <div className="pagination-bar">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                        >
                          ← Trang trước
                        </button>
                        <span className="pagination-info" style={{ fontSize: '0.9rem' }}>
                          Trang {currentPage} / {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                        >
                          Trang sau →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      ) : (
        <div className="home-layout-wrapper" style={{ width: '100%' }}>
          <div className="home-main-content" style={{ width: '100%' }}>
            {/* Products Grid */}
            <div style={{ marginBottom: '4rem' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Đang tải danh sách sản phẩm...</h3>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : products.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 3rem', border: '1px dashed var(--glass-border)' }}>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>Không tìm thấy sản phẩm</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Vui lòng đổi từ khóa hoặc xóa bớt các bộ lọc đang chọn.
                  </p>
                  <button onClick={handleClearFilters} className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}>
                    Thiết lập lại bộ lọc
                  </button>
                </div>
              ) : (
                <>
                  <div className="products-display-grid">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className="pagination-bar">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        ← Trang trước
                      </button>
                      <span className="pagination-info" style={{ fontSize: '0.9rem' }}>
                        Trang {currentPage} / {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        Trang sau →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
