import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function UsersPage({setPage}) {
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
  username: "",
  email: "",
  password: "",
  is_active: true,
});
useEffect(() => {
  apiFetch("/users/me/")
    .then((res) => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then((data) => {
      if (!data.is_staff && !data.is_superuser) {
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
      return;
    }

    const createdUser = await response.json();

    setUsers((prev) => [...prev, createdUser]);

    setNewUser({
      username: "",
      email: "",
      password: "",
      is_active: true,
    });

    setShowCreateForm(false);
  } catch (error) {
    console.error(error);
  }
};
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage system users</p>
        </div>

        <button
  className="create-user-btn"
  onClick={() => setShowCreateForm(true)}
>
  + Create User
</button>
      </div>
{showCreateForm && (
  <div className="user-modal-overlay">
    <div className="user-modal">

      <h2>Create User</h2>

      <div className="user-form-group">
  <label>Username</label>
  <input
    type="text"
    placeholder="Enter username"
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
  <label>Email</label>
  <input
    type="email"
    placeholder="Enter email"
    value={newUser.email}
    onChange={(e) =>
      setNewUser({
        ...newUser,
        email: e.target.value,
      })
    }
  />
</div>

<div className="user-form-group">
  <label>Password</label>
  <input
    type="password"
    placeholder="Enter password"
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
  <span>Active</span>
</label>
      <div className="user-modal-actions">
    <button
  className="create-user-btn"
  onClick={handleCreateUser}
>
  Save
</button>

        <button
          className="cancel-btn"
          onClick={() => setShowCreateForm(false)}
        >
          Cancel
        </button>
      </div>

    </div>
  </div>
)}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            {/* <th>Name</th> */}
            <th>Email</th>
            <th>Active</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              {/* <td>
                {user.first_name} {user.last_name}
              </td> */}

              <td>{user.email}</td>
              <td>{user.is_active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersPage;