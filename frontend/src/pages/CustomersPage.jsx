import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
function CustomersPage(){
const { t } = useTranslation();
const [customers,setCustomers]=useState([]);

const [showModal,setShowModal]=useState(false);

const [editingCustomer,setEditingCustomer]=useState(null);

const [name,setName]=useState("");

const [phone,setPhone]=useState("");

const [address,setAddress]=useState("");

const loadData=()=>{

apiFetch("/customers/")

.then((res)=>res.json())

.then((data)=>{

setCustomers(

Array.isArray(data)

? data

: data.results||[]

);

});

};

useEffect(()=>{

loadData();

},[]);

const openAddModal=()=>{

setEditingCustomer(null);

setName("");

setPhone("");

setAddress("");

setShowModal(true);

};

const openEditModal=(customer)=>{

setEditingCustomer(customer);

setName(customer.name||"");

setPhone(customer.phone||"");

setAddress(customer.address||"");

setShowModal(true);

};

const handleSave=async()=>{

if(!name){

alert(t("customer_name_required"));

return;

}

const url=

editingCustomer

?

`/customers/${editingCustomer.id}/`

:

"/customers/";

const method=

editingCustomer

?

"PUT"

:

"POST";

const response=

await apiFetch(

url,

{

method,

body:JSON.stringify({

name,

phone,

address

})

}

);

if(!response.ok){

alert(t("save_failed"));

return;

}

setShowModal(false);

loadData();

};

return(

<>

<div className="page-header">

<div>

<h1 className="page-title">

{t("customers")}

</h1>

<p className="page-subtitle">

{t("manage_customers")}
</p>

</div>

</div>

<div
style={{

display:"flex",

justifyContent:"flex-end",

gap:"10px",

marginBottom:"16px"

}}
>

<button
className="add-btn"

onClick={()=>{

localStorage.setItem(
"page",
"administration"
);

window.location.reload();

}}
>

{t("back")}

</button>

<button
className="add-btn"
onClick={openAddModal}
>

{t("add_customer")}
</button>

</div>

<div className="card table-wrapper">

<table>

<thead>

<tr>

<th>{t("name")}</th>

<th>{t("phone")}</th>

<th>{t("address")}</th>

<th>{t("action")}</th>

</tr>

</thead>

<tbody>

{

customers.map(

(customer)=>(

<tr
key={customer.id}
>

<td>

{customer.name}

</td>

<td>

{customer.phone||"-"}

</td>

<td>

{customer.address||"-"}

</td>

<td
style={{
textAlign:"center"
}}
>

<button

className="edit-btn"

onClick={()=>

openEditModal(
customer
)

}

>

{t("edit")}

</button>

</td>

</tr>

)

)

}

</tbody>

</table>

</div>

{

showModal

&&

<div
className="modal-overlay"
>

<div
className="modal-content"
>

<h3>

{

editingCustomer

?

t("edit_customer")
:

("add_customer")
}

</h3>

<input

placeholder={t("name")}

value={name}

onChange={(e)=>

setName(
e.target.value
)

}

/>

<input

placeholder={t("phone")}

value={phone}

onChange={(e)=>

setPhone(
e.target.value
)

}

/>

<input

placeholder={t("address")}

value={address}

onChange={(e)=>

setAddress(
e.target.value
)

}

/>

<div
className="modal-actions"
>

<button

className="modal-btn secondary"

onClick={()=>

setShowModal(
false
)

}

>

{t("cancel")}

</button>

<button

className="modal-btn primary"

onClick={handleSave}

>

{t("save")}

</button>

</div>

</div>

</div>

}

</>

);

}

export default CustomersPage;