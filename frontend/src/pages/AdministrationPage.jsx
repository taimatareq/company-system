import { useTranslation } from "react-i18next";
function AdministrationPage() {
const { t } = useTranslation();
const cards = [

{
title:t("users"),
page:"users"
},

{
title:t("branches"),
page:"branches"
},

{
title:t("warehouses"),
page:"warehouses"
},

{
title:t("customers"),
page:"customers"
},

{
title:t("suppliers"),
page:"suppliers"
},

{
title:t("pos"),
page:"pos"
},

{
title:t("exchange_rates"),
page:"exchange-rates"
},

{
title:t("sales_representatives"),
page:"sales-representatives"
},


];

return (

<>

<div className="page-header">

<div>

<h1 className="page-title">

{t("administration")}

</h1>

<p className="page-subtitle">

{t("manage_system_setup")}

</p>

</div>

</div>

<div className="dashboard-grid">

{

cards.map(

(card)=>(

<div

key={card.page}

className="dashboard-card"

onClick={()=>{

localStorage.setItem(
"page",
card.page
);

window.location.reload();

}}

style={{
cursor:"pointer"
}}

>

<h3>

{card.title}

</h3>

</div>

)

)

}

</div>

</>

);

}

export default AdministrationPage;