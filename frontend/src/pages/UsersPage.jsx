import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
function UsersPage({setPage}) {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [newUser, setNewUser] = useState({
  username: "",
  email: "",
  password: "",
  role: "user",
  is_active: true,
});

  const [editingUser, setEditingUser] = useState(null);
 useEffect(() => {
    apiFetch("/users/me/")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setCurrentUserId(data.id);

        const canManageUsers =
        data.is_superuser ||
        data.role === "company_admin";

      if (!canManageUsers) {
        setPage("dashboard");
      }
      })
      .catch(() => {
        setPage("dashboard");
      });
  }, [setPage]);  
  useEffect(() => {
    apiFetch("/users/")
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
const handleCreateUser = async () => {
  try {
    const response = await apiFetch("/users/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData);

      toast.error(t("failed_to_create_user"));
      return;
    }

    const createdUser = await response.json();

    // إضافة المستخدم الجديد مباشرة للقائمة
    setUsers((prev) => [...prev, createdUser]);

    // تصفير الفورم
    setNewUser({
      username: "",
      email: "",
      password: "",
      role: "user",
      is_active: true,
    });

    // إغلاق نافذة الإضافة والعودة للقائمة
    setShowCreateForm(false);

    // رسالة نجاح
   setShowSuccessModal(true);
  } catch (error) {
    console.error(error);
    toast.error(t("failed_to_create_user"));
  }
};
const handleToggleActive = async (user) => {
  try {
    const response = await apiFetch(
      `/users/${user.id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({
          is_active: !user.is_active,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "User update error:",
        data
      );
      return;
    }

    setUsers((prevUsers) =>
      prevUsers.map((item) =>
        item.id === user.id
          ? {
              ...item,
              is_active: data.is_active,
            }
          : item
      )
    );

  } catch (error) {
    console.error(
      "User update error:",
      error
    );
  }
};
const handleUpdateUser = async () => {
  try {
    const formData = new FormData();

    formData.append("username", editingUser.username);
    formData.append("first_name", editingUser.first_name || "");
    formData.append("last_name", editingUser.last_name || "");
    formData.append("email", editingUser.email || "");
    formData.append("phone", editingUser.phone || "");
    formData.append("remove_profile_image",editingUser.remove_profile_image ? "true" : "false");

    // نرسل الصورة فقط إذا اختار المستخدم صورة جديدة
    if (editingUser.new_profile_image) {
      formData.append(
        "profile_image",
        editingUser.new_profile_image
      );
    }

    const response = await apiFetch(
      `/users/${editingUser.id}/`,
      {
        method: "PATCH",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Update user error:", data);
      toast.error(t("failed_to_update_user"));
      return;
    }

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === editingUser.id ? data : user
      )
    );

    toast.success(t("user_updated_successfully"));
    setEditingUser(null);

  } catch (error) {
    console.error("Update user error:", error);
    toast.error(t("failed_to_update_user"));
  }
};
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("users")}</h1>
          <p className="page-subtitle">{t("manage_users")}</p>
        </div>

        <button
  className="create-user-btn"
  onClick={() => setShowCreateForm(true)}
>
  + {t("add_user")}
</button>
      </div>
{showCreateForm && (
  <div className="user-modal-overlay">
    <div className="user-modal">

      <h2>{t("add_user")}</h2>

      <div className="user-form-group">
  <label>{t("username")}</label>
  <input
    type="text"
    placeholder={t("enter_username")}
    value={newUser.username}
    onChange={(e) =>
      setNewUser({
        ...newUser,
        username: e.target.value,
      })
    }
  />
</div>

<div className="user-form-group">
  <label>{t("email")}</label>
  <input
    type="email"
    placeholder={t("enter_email")}
    value={newUser.email}
    onChange={(e) =>
      setNewUser({
        ...newUser,
        email: e.target.value,
      })
    }
  />
  <div className="form-group">
  <label>{t("user_role")}</label>

  <select
    value={newUser.role}
    onChange={(e) =>
      setNewUser({
        ...newUser,
        role: e.target.value,
      })
    }
  >
    <option value="user">
      {t("normal_user")}
    </option>

    <option value="company_admin">
      {t("company_admin")}
    </option>
  </select>
</div>
</div>

<div className="user-form-group">
  <label>{t("password")}</label>
  <input
    type="password"
    placeholder={t("enter_password")}
    value={newUser.password}
    onChange={(e) =>
      setNewUser({
        ...newUser,
        password: e.target.value,
      })
    }
  />
</div>

<label className="user-active">
  <input
    type="checkbox"
    checked={newUser.is_active}
    onChange={(e) =>
      setNewUser({
        ...newUser,
        is_active: e.target.checked,
      })
    }
  />
  <span>{t("active")}</span>
</label>
      <div className="user-modal-actions">
  <button
    type="button"
    className="create-user-btn"
    onClick={handleCreateUser}
  >
    {t("create")}
  </button>

  <button
    type="button"
    className="cancel-btn"
    onClick={() => setShowCreateForm(false)}
  >
    {t("cancel")}
  </button>
</div>

    </div>
  </div>
)}
     <div className="users-list">
  {users.map((user) => (
    <div className="user-card" key={user.id}>

      <div className="user-card-main">
        <div className="user-avatar">
  {user.profile_image ? (
    <>
      <img
        src={user.profile_image}
        alt=""
        className="user-avatar-image"
        onError={(e) => {
          e.currentTarget.style.display = "none";

          const letter =
            e.currentTarget.parentElement.querySelector(
              ".user-avatar-letter"
            );

          if (letter) {
            letter.style.display = "flex";
          }
        }}
      />

      <span
        className="user-avatar-letter"
        style={{ display: "none" }}
      >
        {(user.first_name?.trim() ||
          user.username?.trim() ||
          "U")
          .charAt(0)
          .toUpperCase()}
      </span>
    </>
  ) : (
    <span className="user-avatar-letter">
      {(user.first_name?.trim() ||
        user.username?.trim() ||
        "U")
        .charAt(0)
        .toUpperCase()}
    </span>
  )}
</div>

        <div className="user-info">
          <div className="user-name-row">
            <h3>
              {user.first_name || user.last_name
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                : user.username}
            </h3>

            <span
              className={`user-status ${
                user.is_active ? "active" : "inactive"
              }`}
            >
              {user.is_active ? t("active") : t("inactive")}
            </span>
          </div>

          <span className="user-username">
            {user.username}
          </span>

          <div className="user-contact">
            <span>{user.email || t("no_email")}</span>
            <span>•</span>
            <span>{user.phone || t("no_phone")}</span>
          </div>
          <div className={`auth-provider-badge ${user.auth_provider}`}>
  {user.auth_provider === "google"
    ? t("google_account")
    : t("local_account")}
</div>
<div className="user-meta-row">

  {user.role && (
    <span className={`user-role-badge ${user.role}`}>
      {user.is_superuser
  ? t("system_admin")
  : user.role === "company_admin"
      ? t("company_admin")
      : t("normal_user")}
      </span>
  )}

  {user.organization && (
    <span className="user-org-badge">
      {user.organization.name}
    </span>
  )}

</div>
        </div>
        
      </div>

      <div className="user-card-actions">
        {user.id === currentUserId ? (
          <span className="current-user-badge">
            {t("current_user")}
          </span>
        ) : (
          <button
            className={
              user.is_active
                ? "deactivate-user-btn"
                : "activate-user-btn"
            }
            onClick={() => handleToggleActive(user)}
          >
            {user.is_active ? t("deactivate") : t("activate")}
          </button>
        )}

        <button
          className="edit-user-btn"
          onClick={() => setEditingUser(user)}
        >
          {t("edit")}
        </button>
      </div>

    </div>
  ))}
</div>
     {editingUser && (
  <div
    className="user-modal-overlay"
    onClick={() => setEditingUser(null)}
  >
    <div
      className="user-modal edit-user-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="edit-modal-header">
        <div>
          <h2>{t("edit_user")}</h2>
          <p>{t("update_user_profile")}</p>
        </div>

        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setEditingUser(null)}
        >
          ×
        </button>
      </div>

      {/* Profile Image */}
      <div className="edit-profile-image">
        <div className="edit-profile-image-row">

          <div className="edit-user-avatar">
            {editingUser.new_profile_image ? (
              <img
                src={URL.createObjectURL(
                  editingUser.new_profile_image
                )}
                alt="Preview"
              />
            ) : editingUser.profile_image &&
              !editingUser.remove_profile_image ? (
              <img
                src={editingUser.profile_image}
                alt={
                  editingUser.first_name ||
                  editingUser.username
                }
              />
            ) : (
              <span>
                {(editingUser.first_name?.trim() ||
                  editingUser.username?.trim() ||
                  "U")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="edit-image-actions">
            <strong>{t("profile_photo")}</strong>

            <div className="image-buttons">
              <label className="change-image-btn">
                {t("change_image")}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];

                    if (file) {
                      setEditingUser({
                        ...editingUser,
                        new_profile_image: file,
                        remove_profile_image: false,
                      });
                    }
                  }}
                />
              </label>

              {(editingUser.profile_image ||
                editingUser.new_profile_image) && (
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() =>
                    setEditingUser((prev) => ({
                      ...prev,
                      profile_image: null,
                      new_profile_image: null,
                      remove_profile_image: true,
                    }))
                  }
                >
                  {t("remove_image")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="edit-form-grid">
        <div className="user-form-group">
          <label>{t("first_name")}</label>
          <input
            type="text"
            value={editingUser.first_name || ""}
            onChange={(e) =>
              setEditingUser({
                ...editingUser,
                first_name: e.target.value,
              })
            }
          />
        </div>

        <div className="user-form-group">
          <label>{t("last_name")}</label>
          <input
            type="text"
            value={editingUser.last_name || ""}
            onChange={(e) =>
              setEditingUser({
                ...editingUser,
                last_name: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* Username */}
      <div className="user-form-group">
        <label>{t("username")}</label>
        <input
          type="text"
          value={editingUser.username || ""}
          onChange={(e) =>
            setEditingUser({
              ...editingUser,
              username: e.target.value,
            })
          }
        />
      </div>

      {/* Email */}
      <div className="user-form-group">
        <label>{t("email")}</label>
        <input
          type="email"
          value={editingUser.email || ""}
          onChange={(e) =>
            setEditingUser({
              ...editingUser,
              email: e.target.value,
            })
          }
        />
      </div>

      {/* Phone */}
      <div className="user-form-group">
        <label>{t("phone")}</label>
        <input
          type="text"
          value={editingUser.phone || ""}
          onChange={(e) =>
            setEditingUser({
              ...editingUser,
              phone: e.target.value,
            })
          }
        />
      </div>

      {/* Actions */}
      <div className="user-modal-actions edit-modal-actions">
        <button
          type="button"
          className="cancel-btn"
          onClick={() => setEditingUser(null)}
        >
          {t("cancel")}
        </button>

        <button
          type="button"
          className="save-user-btn"
          onClick={handleUpdateUser}
        >
          {t("save_changes")}
        </button>
      </div>
    </div>
  </div>
)}
{showSuccessModal && (
  <div className="user-modal-overlay">
    <div className="success-modal">

      <div className="success-modal-icon">
        ✓
      </div>

      <h2>{t("user_created")}</h2>

      <p>
        {t("user_created_description")}
      </p>

      <button
        className="save-user-btn"
        onClick={() => setShowSuccessModal(false)}
      >
        {t("done")}
      </button>

    </div>
  </div>
)}
    </div>
  );
}

export default UsersPage;