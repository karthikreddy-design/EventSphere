import Icon from "./Icon";

function DashboardCard({ title, value, icon }) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        {icon && (
          <span className="dashboard-card__icon" aria-hidden="true">
            <Icon name={icon} size={18} />
          </span>
        )}
        <h3 className="dashboard-card__title">{title}</h3>
      </div>
      <p className="dashboard-card__value">{value}</p>
    </article>
  );
}

export default DashboardCard;
