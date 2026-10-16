import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import './Products.css';

function Products() {
  const { addToCart, cartItems } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    'All',
    'Vegetables',
    'Fruits',
    'Grains & Pulses',
    'Dairy & Organic',
    'Herbs & Spices'
  ]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, page]);

  async function fetchProducts(overrideSearch) {
    setLoading(true);
    setError('');
    try {
      const search = overrideSearch !== undefined ? overrideSearch : searchQuery;
      const data = await productService.getProducts({
        search,
        category: selectedCategory,
        sortBy,
        page,
        limit: 6
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  }

  function handleCategoryClick(cat) {
    setSelectedCategory(cat);
    setPage(1);
  }

  function handleClearFilters() {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('newest');
    setPage(1);
    fetchProducts('');
  }

  return (
    <div className="products-page">
      {/* Hero Banner */}
      <section className="products-hero">
        <div className="hero-content">
          <span className="hero-tag">Tamil Nadu listings</span>
          <h1>Shop produce from local farms</h1>
          <p>
            Search by product or farmer. Prices, stock, and harvest dates come from farmer listings
            and are checked again when you place an order.
          </p>

          {/* Search bar inside hero */}
          <form onSubmit={handleSearchSubmit} className="hero-search-form">
            <span className="search-icon">Search</span>
            <input
              type="text"
              placeholder="Search by vegetable, fruit, grain, or farmer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  fetchProducts('');
                }}
              >
                ✕
              </button>
            )}
          </form>
        </div>
      </section>

      <div className="products-container">
        {/* Category Filter Bar */}
        <div className="filter-controls-row">
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="sort-box">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div className="results-summary">
          <span>
            Showing <strong>{products.length}</strong> of <strong>{total}</strong> products
            {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>

          {(selectedCategory !== 'All' || searchQuery) && (
            <button onClick={handleClearFilters} className="clear-all-link">
              Clear all filters
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Product Cards Grid */}
        {loading ? (
          <div className="products-loading">
            <div className="spinner"></div>
            <p>Fetching farm-fresh produce...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-products-box">
            <h3>No produce found</h3>
            <p>We couldn't find any products matching your current search or category filter.</p>
            <button onClick={handleClearFilters} className="fh-btn-primary">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((item) => {
              const inCart = cartItems.find((c) => (c._id || c.id) === item._id);
              return (
                <ProductCard
                  key={item._id}
                  item={item}
                  onAdd={addToCart}
                  inCart={Boolean(inCart)}
                />
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="page-btn prev-next"
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`page-btn ${page === p ? 'active' : ''}`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="page-btn prev-next"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
