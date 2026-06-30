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
  const [selectedFeatured, setSelectedFeatured] = useState(false);

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
      // Check if it's clicking on the trigger button itself to avoid double toggling
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
  }, [activeSearch, selectedCategory, selectedBrand, selectedGender, selectedSort, currentPage, selectedFeatured]);

  const fetchCatalogs = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands')
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
        limit: 8,
        sort: selectedSort
      };

      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedBrand) params.brand_id = selectedBrand;
      if (selectedGender) params.gender = selectedGender;
      if (selectedFeatured) params.featured = 'true';

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

  const handleBrandSelect = (id) => {
    setSelectedBrand(selectedBrand === id ? '' : id);
    setCurrentPage(1);
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

  const handleClearFilters = () => {
    setSearchVal('');
    setActiveSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedGender('');
    setSelectedSort('newest');
    setCurrentPage(1);
    setExpandedCategory('');
    setSelectedFeatured(false);
  };

  const hasActiveFilters = activeSearch || selectedCategory || selectedBrand || selectedGender || selectedSort !== 'newest' || selectedFeatured;

  // Flatten categories for filter bar
  const flatCategories = categories.reduce((acc, cat) => {
    acc.push(cat);
    if (cat.children) acc.push(...cat.children);
    return acc;
  }, []);

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
        <span className="brands-bar-label">
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
              onClick={() => handleBrandSelect('')}
            >
              Tất cả
            </button>
            {brands.map(brand => (
              <button key={brand.id} className={`filter-pill brand ${selectedBrand === brand.id ? 'active' : ''}`} onClick={() => handleBrandSelect(brand.id)}>
                {brand.name}
              </button>
            ))}
          </div>
          <button className="filter-scroll-btn right" onClick={() => scrollPills(brandScrollRef, 1)} aria-label="Cuộn phải">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* ─── Banner Slider Section ─────────────────────────────────────────── */}
      {banners.length > 0 ? (
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
                  src={`http://localhost:8080${banner.image_url}`}
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
      )}

      {/* ─── Main Layout ───────────────────────────────────────────────────── */}
      <div className="home-layout-wrapper" style={{ width: '100%' }}>
        <div className="home-main-content" style={{ width: '100%' }}>

      {/* ─── Premium Filter Bar ──────────────────────────────────────────── */}
      <div className="filter-bar-wrap">

        {/* Row 1: Sort + Count + Clear */}
        <div className="filter-bar-top">

          {/* Sort */}
          <div className="filter-sort-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="11" y2="18"/></svg>
            <select value={selectedSort} onChange={handleSortSelect} className="filter-sort-select">
              <option value="newest">Mới nhất</option>
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

          {/* Clear all */}
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="filter-clear-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="filter-active-chips">
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
            {selectedBrand && (() => {
              const brand = brands.find(b => b.id === selectedBrand);
              return brand ? (
                <button className="active-chip" style={{ background: 'linear-gradient(135deg, hsl(38,92%,45%), hsl(25,90%,55%))' }} onClick={() => handleBrandSelect(selectedBrand)}>
                  🏷 {brand.name} <span className="active-chip-x">×</span>
                </button>
              ) : null;
            })()}
            {selectedGender && (
              <button className="active-chip" style={{ background: 'linear-gradient(135deg, hsl(280,80%,60%), hsl(187,92%,46%))' }} onClick={() => handleGenderSelect(selectedGender)}>
                {selectedGender === 'male' ? '♂ Nam' : selectedGender === 'female' ? '♀ Nữ' : '⚡ Unisex'} <span className="active-chip-x">×</span>
              </button>
            )}
            {selectedFeatured && (
              <button className="active-chip" style={{ background: 'linear-gradient(135deg, hsl(38,92%,45%), hsl(25,90%,55%))' }} onClick={() => { setSelectedFeatured(false); setCurrentPage(1); }}>
                ⭐ Nổi bật <span className="active-chip-x">×</span>
              </button>
            )}
          </div>
        )}

        {/* Row 4: Gender */}
        <div className="filter-group-row">
          <span className="filter-group-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
            Giới tính
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', padding: '3px 0' }}>
            {[
              { key: 'male',   label: '♂ Nam' },
              { key: 'female', label: '♀ Nữ' },
              { key: 'unisex', label: '⚡ Unisex' },
            ].map(g => (
              <button key={g.key} className={`filter-pill gender ${selectedGender === g.key ? 'active' : ''}`} onClick={() => handleGenderSelect(g.key)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 5: Special Filters */}
        <div className="filter-group-row" style={{ marginTop: '0.5rem' }}>
          <span className="filter-group-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Đặc biệt
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', padding: '3px 0' }}>
            <button 
              className={`filter-pill ${selectedFeatured ? 'active' : ''}`}
              onClick={() => {
                setSelectedFeatured(!selectedFeatured);
                setCurrentPage(1);
              }}
              style={{
                background: selectedFeatured ? 'linear-gradient(135deg, hsl(38,92%,45%), hsl(25,90%,55%))' : 'none',
                borderColor: selectedFeatured ? 'transparent' : 'var(--glass-border)',
                color: selectedFeatured ? '#fff' : 'inherit'
              }}
            >
              ⭐ Sản phẩm nổi bật
            </button>
          </div>
        </div>

      </div>

      {/* ─── Products Grid ──────────────────────────────────────────────────── */}
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
            {/* Products Grid */}
            <div className="products-display-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
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

        </div> {/* End of Main Content */}
      </div> {/* End of Layout Wrapper */}

    </div>
  );
}

export default Home;
