import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createEvent, updateEvent, uploadEventImage } from "../services/eventService";

const initialForm = {
  title: "",
  description: "",
  category: "",
  location: "",
  event_date: "",
  event_time: "",
  max_participants: "",
  status: "Upcoming",
};

function EventForm({ event = null, isEdit = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || "",
        description: event.description || "",
        category: event.category || "",
        location: event.location || "",
        event_date: event.event_date || "",
        event_time: event.event_time || "",
        max_participants: event.max_participants?.toString() || "",
        status: event.status || "Upcoming",
      });
      setImagePreview(event.image_url || "");
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Event title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.category.trim()) return "Category is required";
    if (!form.location.trim()) return "Location is required";
    if (!form.event_date) return "Date is required";
    if (!form.event_time.trim()) return "Time is required";
    if (!form.max_participants || Number(form.max_participants) <= 0) {
      return "Maximum participants must be greater than 0";
    }
    if (!isEdit && !imageFile && !imagePreview) {
      return "Event banner image is required";
    }
    return null;
  };

  const handleReset = () => {
    if (isEdit && event) {
      setForm({
        title: event.title || "",
        description: event.description || "",
        category: event.category || "",
        location: event.location || "",
        event_date: event.event_date || "",
        event_time: event.event_time || "",
        max_participants: event.max_participants?.toString() || "",
        status: event.status || "Upcoming",
      });
      setImagePreview(event.image_url || "");
    } else {
      setForm(initialForm);
      setImagePreview("");
    }
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = event?.image_url || "";

      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile);
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        location: form.location.trim(),
        event_date: form.event_date,
        event_time: form.event_time.trim(),
        max_participants: Number(form.max_participants),
        image_url: imageUrl,
        status: form.status,
      };

      if (isEdit && event?.id) {
        await updateEvent(event.id, payload);
        toast.success("Event updated successfully");
      } else {
        await createEvent(payload);
        toast.success("Event created successfully");
      }

      navigate("/admin/events");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="event-form__grid">
        <label className="event-form__field event-form__field--full">
          <span>Event Title</span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter event title"
          />
        </label>

        <label className="event-form__field event-form__field--full">
          <span>Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter event description"
            rows={3}
          />
        </label>

        <label className="event-form__field">
          <span>Category</span>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Technology"
          />
        </label>

        <label className="event-form__field">
          <span>Location</span>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Main Auditorium"
          />
        </label>

        <label className="event-form__field">
          <span>Date</span>
          <input
            type="date"
            name="event_date"
            value={form.event_date}
            onChange={handleChange}
          />
        </label>

        <label className="event-form__field">
          <span>Time</span>
          <input
            name="event_time"
            value={form.event_time}
            onChange={handleChange}
            placeholder="e.g. 10:00 AM"
          />
        </label>

        <label className="event-form__field">
          <span>Maximum Participants</span>
          <input
            type="number"
            min="1"
            name="max_participants"
            value={form.max_participants}
            onChange={handleChange}
            placeholder="e.g. 300"
          />
        </label>

        {isEdit && (
          <label className="event-form__field">
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
        )}

        <label className="event-form__field event-form__field--full">
          <span>Event Banner Image</span>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Event preview"
              className="event-form__preview"
            />
          )}
        </label>
      </div>

      <div className="event-form__actions">
        <button type="submit" className="event-form__btn event-form__btn--primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Event"}
        </button>
        <button
          type="button"
          className="event-form__btn event-form__btn--secondary"
          onClick={handleReset}
          disabled={submitting}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

export default EventForm;
