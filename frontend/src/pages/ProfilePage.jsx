import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import toast from "react-hot-toast";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    apiFetch("/users/me/")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);

        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || "");
      })
      .catch((error) => {
        console.error(
          "Profile loading error:",
          error
        );

        toast.error("Failed to load profile");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
  try {
    setSaving(true);

    const formData = new FormData();

    formData.append(
      "first_name",
      firstName
    );

    formData.append(
      "last_name",
      lastName
    );

    formData.append(
      "phone",
      phone
    );

    if (profileImage) {
      formData.append(
        "profile_image",
        profileImage
      );
    }

    const response = await apiFetch(
      "/users/me/",
      {
        method: "PATCH",
        body: formData,
      }
    );

    const data = await response.json();

      if (!response.ok) {
        console.error(
          "Profile update error:",
          data
        );

        toast.error(
          "Failed to update profile"
        );

        return;
      }

      setUser((previousUser) => ({
        ...previousUser,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      }));

      toast.success(
        "Profile updated successfully"
      );
      window.dispatchEvent(
        new Event("profileUpdated")
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      toast.error(
        "Failed to update profile"
      );

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        Failed to load profile.
      </div>
    );
  }

  return (
    <div className="profile-page">

      <h1>My Profile</h1>

      <div className="profile-card">

        <div className="profile-avatar-wrapper">

  <label htmlFor="profile-image-input">

    {previewImage || user.profile_image ? (
      <img
        src={previewImage || user.profile_image}
        alt="Profile"
        className="profile-avatar"
      />
    ) : (
      <div className="profile-avatar-placeholder">
        {firstName
          ? firstName.charAt(0).toUpperCase()
          : user.username.charAt(0).toUpperCase()}
      </div>
    )}

    <div className="profile-avatar-edit">
      ✎
    </div>

  </label>

  <input
    id="profile-image-input"
    type="file"
    accept="image/*"
    hidden
    onChange={(e) => {
  const file = e.target.files[0];

  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    toast.error(
      "Please select a JPG, PNG or WEBP image"
    );
    e.target.value = "";
    return;
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    toast.error(
      "Image must be smaller than 5 MB"
    );
    e.target.value = "";
    return;
  }

  setProfileImage(file);

  setPreviewImage(
    URL.createObjectURL(file)
  );
}}
  />

</div>

        <div className="profile-details">

          <div>
            <strong>First Name</strong>

            <input
              type="text"
              value={firstName}
              onChange={(e) =>
                setFirstName(e.target.value)
              }
            />
          </div>

          <div>
            <strong>Last Name</strong>

            <input
              type="text"
              value={lastName}
              onChange={(e) =>
                setLastName(e.target.value)
              }
            />
          </div>

          <div>
            <strong>Email</strong>

            <input
              type="email"
              value={user.email}
              disabled
            />
          </div>

          <div>
            <strong>Phone</strong>

            <input
              type="text"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="Enter phone number"
            />
          </div>

        </div>

        <div className="profile-actions">
          <button
            className="profile-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>

      </div>

    </div>
  );
}

export default ProfilePage;