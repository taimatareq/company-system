import { useEffect,useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";

function ExchangeRatesPage(){
const { t } = useTranslation();
const [rates,setRates]=useState([]);

const [showModal,setShowModal]=useState(false);

const [editingRate,setEditingRate]=useState(null);

const [rateDate,setRateDate]=useState(

new Date().toISOString().slice(0,10)

);

const [usdToSyp,setUsdToSyp]=useState("");

const loadData=()=>{

apiFetch("/exchange-rates/")

.then((res)=>res.json())

.then((data)=>{

setRates(

Array.isArray(data)

?data

:data.results||[]

);

});

};

useEffect(()=>{

loadData();

},[]);

const openAddModal=()=>{

setEditingRate(null);

setRateDate(

new Date()

.toISOString()

.slice(0,10)

);

setUsdToSyp("");

setShowModal(true);

};

const openEditModal=(rate)=>{

setEditingRate(rate);

setRateDate(

rate.rate_date

);

setUsdToSyp(

rate.usd_to_syp

);

setShowModal(true);

};

const handleSave=async()=>{

if(!rateDate||!usdToSyp){

alert(

t("all_fields_required")

);

return;

}

const url=

editingRate

? `/exchange-rates/${editingRate.id}/`

: "/exchange-rates/";

const method=

editingRate

? "PUT"

: "POST";

const response=

await apiFetch(

url,

{

method,

body:JSON.stringify({

rate_date:rateDate,

usd_to_syp:

Number(

usdToSyp

)

})

}

);

if(!response.ok){

alert(

t("save_failed")

);

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

{t("exchange_rates")}
</h1>

<p className="page-subtitle">

{t("manage_usd_exchange_rates")}
</p>

</div>

</div>

<div

style={{

display:"flex",

justifyContent:"flex-end",

marginBottom:"16px"

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

onClick={openAddModal}

>

{t("add_rate")}

</button>

</div>

<div className="card table-wrapper">

<table>

<thead>

<tr>

<th>

{t("date")}

</th>

<th>

{t("usd_to_syp")}

</th>

<th>

{t("Action")}

</th>

</tr>

</thead>

<tbody>

{

rates.map(

(rate)=>(

<tr

key={rate.id}

>

<td>

{rate.rate_date}

</td>

<td>

{rate.usd_to_syp}

</td>

<td
style={{ textAlign: "center" }}
>

<button
  className="edit-btn"
  onClick={() => openEditModal(rate)}
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

{showModal&&(

<div

className="modal-overlay"

>

<div

className="modal-content"

>

<h3>

{

editingRate

?

t("edit_rate")

:

t("add_rate")

}

</h3>

<input

type="date"

value={rateDate}

onChange={(e)=>

setRateDate(

e.target.value

)

}

/>

<input

type="number"

value={usdToSyp}

placeholder={t("usd_to_syp")}

onChange={(e)=>

setUsdToSyp(

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

)}

</>

);

}

export default ExchangeRatesPage;