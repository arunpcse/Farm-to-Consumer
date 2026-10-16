function BrandMark({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="fh-brand-mark"
    >
      <rect width="32" height="32" rx="6" fill="#244C3A" />
      <path
        d="M10 22c4.5-1 8-4.2 9.8-9.2C16.2 13.4 12.6 16 10 22Z"
        fill="#E8EEE5"
      />
      <path
        d="M22 9.5c-3.8 1.4-6.4 4.6-7.4 8.7 4.6-1.6 7.8-4.6 9.2-8.7-.5 0-1.2 0-1.8 0Z"
        fill="#F7F6F0"
      />
      <path d="M16 13.5v9.5" stroke="#E8EEE5" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default BrandMark;
