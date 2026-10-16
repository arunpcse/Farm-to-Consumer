import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const CATEGORY_META = {
  'Vegetables': { icon: '🥬', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', color: '#2e7d32' },
  'Fruits': { icon: '🍎', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', color: '#e65100' },
  'Grains & Pulses': { icon: '🌾', bg: 'linear-gradient(135deg, #fef9e7, #fdebd0)', color: '#b7950b' },
  'Dairy & Organic': { icon: '🥛', bg: 'linear-gradient(135deg, #e1f5fe, #b3e5fc)', color: '#0277bd' },
  'Herbs & Spices': { icon: '🌿', bg: 'linear-gradient(135deg, #f1f8e9, #dcedc8)', color: '#558b2f' },
};

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProductCard({ item, onAdd, inCart }) {
  const [imgError, setImgError] = useState(false);
  const harvest = formatDate(item.harvestDate);
  const farmerLink = item.farmerId ? `/farmer/${item.farmerId}` : '/find-farmers';
  const productLink = `/products/${item._id || item.id}`;
  const meta = CATEGORY_META[item.category] || { icon: '🌱', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', color: '#2e7d32' };

  return (
    <article className="fh-product-card">
      <Link to={productLink} className="fh-product-card-media-link" aria-label={`View ${item.name} details`}>
        <div className="fh-product-card-media" style={{ background: meta.bg }}>
          {item.image && !imgError ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="fh-product-placeholder-badge" style={{ color: meta.color }}>
              <span className="fh-placeholder-icon">{meta.icon}</span>
              <span className="fh-placeholder-cat">{item.category || 'Fresh Produce'}</span>
            </div>
          )}
          {item.category && <span className="fh-product-chip">{item.category}</span>}
        </div>
      </Link>
      <div className="fh-product-card-body">
        <p className="fh-product-farm">
          {item.farmerName || 'Local farm'}
          {item.farmLocation ? ` · ${item.farmLocation}` : ''}
        </p>
        {harvest && <p className="fh-product-harvest">Harvested {harvest}</p>}
        <h3>
          <Link to={productLink} className="fh-product-title-link">
            {item.name}
          </Link>
        </h3>
        {item.stock != null && (
          <p className="fh-product-stock">
            {item.stock > 0 ? `${item.stock} ${item.unit || 'kg'} available` : 'Out of stock'}
          </p>
        )}
        <div className="fh-product-card-foot">
          <p className="fh-product-price">
            ₹{item.price}
            <span>/{item.unit || 'kg'}</span>
          </p>
          {onAdd && (
            <button
              type="button"
              className="fh-product-add"
              onClick={() => onAdd(item, 1)}
              disabled={item.stock === 0}
            >
              {inCart ? '+' : 'Add'}
            </button>
          )}
        </div>
        <Link to={farmerLink} className="fh-product-farmer-link">
          View farmer
        </Link>
      </div>
    </article>
  );
}

export default ProductCard;
