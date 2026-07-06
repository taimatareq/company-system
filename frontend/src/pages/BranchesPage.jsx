import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
function BranchesPage() {
const { t } = useTranslation();
const [branches,setBranches]=useState([]);
const [showModal,setShowModal]=useState(false);
const [name, setName] = useState("");
const [location, setLocation] = useState("");
const [phone, setPhone] = useState("");
const [editingBranch, setEditingBranch] = useState(null);
const [isActive,setIsActive]=
useState(true);
useEffect(()=>{

apiFetch("/branches/")

.then(
(res)=>
res.json()
)

.then((data)=>{

setBranches(

Array.isArray(data)

? data

: data.results || []

);

});

},[]);
const handleSaveBranch = async () => {
  if (!name) {
    alert("Branch name is required");
    return;
  }

  const url = editingBranch
    ? `/branches/${editingBranch.id}/`
    : "/branches/";

  const method = editingBranch ? "PUT" : "POST";

  const response = await apiFetch(url, {
    method,
    body: JSON.stringify({
      name,
      location,
      phone,
      is_active: isActive,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    alert(JSON.stringify(error));
    return;
  }

  const savedBranch = await response.json();

  if (editingBranch) {
    setBranches((prev) =>
      prev.map((branch) =>
        branch.id === savedBranch.id ? savedBranch : branch
      )
    );
  } else {
    setBranches((prev) => [savedBranch, ...prev]);
  }

  setEditingBranch(null);
  setName("");
  setLocation("");
  setPhone("");
  setShowModal(false);
};
return(

<>

<div className="page-header">

<div>

<h1 className="page-title">

{t("branches")}

</h1>

<p className="page-subtitle">

{t("manage_company_branches")}
</p>

</div>

</div>
<div
style={{

display:"flex",

justifyContent:
"flex-end",

marginBottom:
"16px"

}}
>
<button
className="add-btn"
onClick={()=>
localStorage.setItem(
"page",
"administration"
)
||
window.location.reload()
}
>

{t("back")}

</button>
<button
  className="add-btn"
  onClick={() => {
    setEditingBranch(null);
    setName("");
    setLocation("");
    setPhone("");
    setShowModal(true);
    setIsActive(true);
  }}
>
 {t("add_branch")}
</button>

</div>
<div className="card table-wrapper">

<table>

<thead>

<tr>

<th>
 {t("name")}


</th>

<th>{t("location")}</th>
<th> {t("phone")}</th>
<th> {t("status")}</th>
<th>{t("action")}</th>
</tr>

</thead>

<tbody>

{

branches.map(

(branch)=>(

<tr
key={branch.id}
>

<td>

{branch.name}

</td>

<td>
{branch.location || "-"}
</td>

<td>
{branch.phone || "-"}
</td>

<td>

{
branch.is_active

?

t("active")
:

t("inactive")
}

</td>
<td style={{ textAlign: "center" }}>
  <button
    style={{
      background: "#9CA3AF",
      color: "white",
      border: "none",
      padding: "8px 18px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
    }}
    onClick={() => {
      setEditingBranch(branch);
      setName(branch.name || "");
      setLocation(branch.location || "");
      setPhone(branch.phone || "");
      setShowModal(true);
      setIsActive(branch.is_active);
    }}
  >
{t("edit") } </button>
</td>
</tr>

)

)

}

</tbody>

</table>

</div>
{showModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>

{
editingBranch

?

t("edit_branch")
:

t("add_branch")

}

</h3>

      <input
        placeholder={t("branch_name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder={t("location")}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <input
        placeholder={t("phone")}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
<div
style={{
display:"flex",
alignItems:"center",
gap:"10px",
marginTop:"12px"
}}
>

<input
type="checkbox"
checked={isActive}
onChange={(e)=>
setIsActive(
e.target.checked
)
}
/>

<label>

{t("active_branch")}</label>

</div>
      <div className="modal-actions">
        <button
          className="modal-btn secondary"
          onClick={() => setShowModal(false)}
        >
          {t("cancel")}
        </button>

        <button
          className="modal-btn primary"
          onClick={handleSaveBranch}
        >
          {t("save")}
        </button>
      </div>
    </div>
  </div>
)}
</>

);

}

export default BranchesPage;