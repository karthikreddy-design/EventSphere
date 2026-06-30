import {
  getRegistrationBlockReason,
  getRegistrationButtonLabel,
} from "../utils/eventValidation";

function RegistrationButton({
  event,
  isRegistered = false,
  registering = false,
  onRegister,
  variant = "card",
}) {
  const blockReason = getRegistrationBlockReason(event, { isRegistered });
  const isDisabled = Boolean(blockReason) || registering;
  const label =
    variant === "details" && !blockReason && !registering
      ? "Register"
      : getRegistrationButtonLabel(blockReason, { registering });

  const classPrefix =
    variant === "details"
      ? "event-details-page__btn"
      : "participant-event-card__btn";

  const handleClick = (e) => {
    if (variant === "card") {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isDisabled && onRegister) {
      onRegister(event);
    }
  };

  let modifier = "--register";
  if (blockReason === "ALREADY_REGISTERED") {
    modifier = "--registered";
  } else if (blockReason) {
    modifier = "--disabled";
  }

  return (
    <button
      type="button"
      className={`${classPrefix} ${classPrefix}${modifier}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {label}
    </button>
  );
}

export default RegistrationButton;
