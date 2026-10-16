import { Link } from 'react-router-dom';
import './ProductCard.css';

const FALLBACK =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProductCard({ item, onAdd, inCart }) {
  const harvest = formatDate(item.harvestDate);
  const farmerLink = item.farmerId ? `/farmer/${item.farmerId}` : '/find-farmers';
  const productLink = `/products/${item._id || item.id}`;

  return (
    <article className="fh-product-card">
      <Link to={productLink} className="fh-product-card-media-link" aria-label={`View ${item.name} details`}>
        <div className="fh-product-card-media">
          <img src={item.image || FALLBACK} alt={item.name} loading="lazy" />
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
