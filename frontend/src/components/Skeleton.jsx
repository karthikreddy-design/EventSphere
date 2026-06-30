function Skeleton({ className = "", style }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-grid skeleton-grid--cards">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <Skeleton className="skeleton-card__icon" />
          <Skeleton className="skeleton-card__title" />
          <Skeleton className="skeleton-card__value" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ count = 3 }) {
  return (
    <div className="skeleton-grid skeleton-grid--charts">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-chart">
          <Skeleton className="skeleton-chart__title" />
          <Skeleton className="skeleton-chart__body" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-table">
      <Skeleton className="skeleton-table__header" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="skeleton-table__row" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-list__item">
          <Skeleton className="skeleton-list__image" />
          <div className="skeleton-list__content">
            <Skeleton className="skeleton-list__line skeleton-list__line--short" />
            <Skeleton className="skeleton-list__line" />
            <Skeleton className="skeleton-list__line skeleton-list__line--medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="skeleton-page">
      <Skeleton className="skeleton-page__title" />
      <Skeleton className="skeleton-page__subtitle" />
      <CardSkeleton count={4} />
    </div>
  );
}

export default Skeleton;
