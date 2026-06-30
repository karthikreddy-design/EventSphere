import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "../../components/Icon";
import {
  changePassword,
  getProfile,
  updateProfile,
  uploadProfileImage,
} from "../../services/profileService";
import "../../styles/profile.css";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  department: "",
  profile_image: "",
};

function Profile() {
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getProfile();
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          department: data.department || "",
          profile_image: data.profile_image || "",
        });
        setImagePreview(data.profile_image || "");
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

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

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      let profileImageUrl = form.profile_image;

      if (imageFile) {
        profileImageUrl = await uploadProfileImage(imageFile);
      }

      const updated = await updateProfile({
        name: form.name,
        phone: form.phone,
        department: form.department,
        profile_image: profileImageUrl,
      });

      setForm({
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        department: updated.department || "",
        profile_image: updated.profile_image || "",
      });
      setImagePreview(updated.profile_image || "");
      setImageFile(null);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please enter and confirm your new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(newPassword);
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="profile-page__loading">Loading profile...</div>;
  }

  return (
    <section className="profile-page">
      <header className="profile-page__header">
        <h1 className="profile-page__title">Profile</h1>
        <p className="profile-page__subtitle">Manage your account information</p>
      </header>

      <form className="profile-page__card" onSubmit={handleSave}>
        <div className="profile-page__photo-section">
          <div className="profile-page__avatar">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" />
            ) : (
              <Icon name="profile" size={36} />
            )}
          </div>
          <label className="profile-page__upload-btn">
            Choose Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
          </label>
        </div>

        <div className="profile-page__fields">
          <label className="profile-page__field profile-page__field--full">
            <span>Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              disabled={saving}
            />
          </label>

          <label className="profile-page__field profile-page__field--full">
            <span>Email</span>
            <input type="email" name="email" value={form.email} disabled readOnly />
          </label>

          <label className="profile-page__field">
            <span>Phone</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone number"
              disabled={saving}
            />
          </label>

          <label className="profile-page__field">
            <span>Department</span>
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              disabled={saving}
            />
          </label>
        </div>

        <div className="profile-page__password-section">
          <button
            type="button"
            className="profile-page__password-toggle"
            onClick={() => setShowPasswordForm((prev) => !prev)}
          >
            {showPasswordForm ? "Hide Change Password" : "Change Password"}
          </button>

          {showPasswordForm && (
            <div className="profile-page__password-form">
              <label className="profile-page__field">
                <span>New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={changingPassword}
                />
              </label>
              <label className="profile-page__field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={changingPassword}
                />
              </label>
              <button
                type="button"
                className="profile-page__btn profile-page__btn--secondary"
                onClick={handlePasswordChange}
                disabled={changingPassword}
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}
        </div>

        <div className="profile-page__actions">
          <button
            type="submit"
            className="profile-page__btn profile-page__btn--primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default Profile;
