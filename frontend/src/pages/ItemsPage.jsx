import { apiFetch } from "../api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaPlus,
  FaBoxOpen,
  FaBoxes,
  FaWarehouse,
  FaShoppingCart,
  FaSearch,
  FaDollarSign,
  FaFilter,
} from "react-icons/fa";

import toast from "react-hot-toast";

import ItemForm from "../components/items/ItemForm.jsx";
import ItemsTable from "../components/items/ItemsTable.jsx";

const API_URL = "http://127.0.0.1:8000/api";

function ItemsPage({setPage}) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState({
    value: "newest",
    label: "Newest",
  });

  const [priceFilter, setPriceFilter] = useState({
    value: "all",
    label: "All Prices",
  });

  const [taxFilter, setTaxFilter] = useState({
    value: "all",
    label: "All Taxes",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetch(`${API_URL}/items/`)
      .then((res) => res.json())
      .then((data) => {
      console.log("API DATA:", data);

      const itemsList = Array.isArray(data) ? data : data.results;

      console.log("ITEMS LIST:", itemsList);

      setItems(itemsList || []);
      setLoading(false);
})
      .catch((err) => {
        console.error(err);
        toast.error(t("failed_to_fetch_items"));
        setLoading(false);
      });
  }, []);

  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm(t("delete_this_item?"))) return;

    fetch(`${API_URL}/items/${id}/`, {
      method: "DELETE",
    })
      .then(() => {
        setItems(items.filter((item) => item.id !== id));
        toast.success(t("item_deleted_successfully"));
      })
      .catch((err) => {
        console.error(err);
        toast.error(t("failed_to_delete_item"));
      });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = (itemData) => {
    if (
      Number(itemData.retail_tax_rate) < 0 ||
      Number(itemData.retail_tax_rate) > 100
    ) {
      toast.error(t("retail_tax_must_be_between_0%_and_100%"));
      return;
    }

    if (editingItem) {
      
      apiFetch(`/items/${editingItem.id}/`, {
      method: "PUT",

      body: JSON.stringify({
        ...itemData,
        id: editingItem.id,
      }),
    })
        .then((res) => res.json())
        .then((updatedItem) => {
          setItems(
            items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            )
          );

          toast.success(t("item_updated_successfully"));
          resetForm();
        })
        .catch((err) => {
          console.error(err);
          toast.error(t("failed_to_update_item"));
        });
    } else {

  console.log(itemData);

  apiFetch("/items/", {
    method: "POST",

    body: JSON.stringify(itemData),
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) {
        if (data.code) {
          toast.error(t("item_code_exists"));
        } else if (data.name) {
          toast.error(data.name[0]);
        } else {
          toast.error(t("failed_to_add_item"));
        }

        return;
      }

      // نجاح الإضافة
      setItems([...items, data]);
      toast.success(t("item_added_successfully"));
   

      resetForm();

    })
    .catch((err) => {
      console.error(err);
    });

}
  };

  let filteredItems = items.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (priceFilter.value === "under50") {
    filteredItems = filteredItems.filter(
      (i) => Number(i.retail_price) < 50
    );
  }

  if (priceFilter.value === "over50") {
    filteredItems = filteredItems.filter(
      (i) => Number(i.retail_price) >= 50
    );
  }

  if (taxFilter.value === "low") {
    filteredItems = filteredItems.filter(
      (i) => Number(i.retail_tax_rate) < 10
    );
  }

  if (taxFilter.value === "high") {
    filteredItems = filteredItems.filter(
      (i) => Number(i.retail_tax_rate) >= 10
    );
  }

  if (sortBy.value === "newest") {
    filteredItems.sort((a, b) => b.id - a.id);
  }

  if (sortBy.value === "oldest") {
    filteredItems.sort((a, b) => a.id - b.id);
  }

  if (sortBy.value === "az") {
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sortBy.value === "za") {
    filteredItems.sort((a, b) => b.name.localeCompare(a.name));
  }

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentItems = filteredItems.slice(startIndex, endIndex);
  const productsCount = items.filter(
    (item) => item.item_type === "product").length;

  const servicesCount = items.filter(
    (item) => item.item_type === "service").length;
  return (
    <>
   

        <div className="page-header">
          <div>
            <h1 className="page-title">{t("items")}</h1>
            <p className="page-subtitle">{t("manage_your_products")}</p>
          </div>

          {!showForm && (
            <button className="add-btn" onClick={() => setShowForm(true)}>
              <FaPlus />
              {t("add_item")}
            </button>
          )}
        </div>

        {/* <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FaBoxes />
            </div>
            <h3>{items.length}</h3>
            <p>{t("total_items")}</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <FaDollarSign />
            </div>
            <h3>
              $
              {items
                .reduce((t, i) => t + Number(i.retail_price || 0), 0)
                .toFixed(2)}
            </h3>
            <p>{t("total_retail_value")}</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <FaFilter />
            </div>
            <h3>{filteredItems.length}</h3>
            <p>{t("filtered_items")}</p>
          </div>
        </div> */}
<div className="stats-grid">

  <div className="stat-card">
    <div className="stat-icon blue">
      <FaBoxes />
    </div>

    <h3>{items.length}</h3>

    <p>{t("total_items")}</p>
  </div>

  <div className="stat-card">
    <div className="stat-icon green">
      <FaBoxOpen />
    </div>

    <h3>{productsCount}</h3>

    <p>{t("products")}</p>
  </div>

  <div className="stat-card">
    <div className="stat-icon purple">
      <FaWarehouse />
    </div>

    <h3>{servicesCount}</h3>

    <p>{t("services")}</p>
  </div>

</div>
        {showForm && (
          <div className="card">
            <ItemForm
              editingItem={editingItem}
              onSave={handleSave}
              onCancel={resetForm}
            />
          </div>
        )}

        <div className="table-header">
          <div className="filters-row">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder={t("search_items")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={sortBy.value}
              onChange={(e) =>
                setSortBy({
                  value: e.target.value,
                  label: e.target.options[e.target.selectedIndex].text,
                })
              }
            >
              <option value="newest">{t("newest")}</option>
              <option value="oldest">{t("oldest")}</option>
              <option value="az">{t("A-Z")}</option>
              <option value="za">{t("Z-A")}</option>
            </select>

            <select
              className="filter-select"
              value={priceFilter.value}
              onChange={(e) =>
                setPriceFilter({
                  value: e.target.value,
                  label: e.target.options[e.target.selectedIndex].text,
                })
              }
            >
              <option value="all">{t("all_prices")}</option>
              <option value="under50">{t("under_$50")}</option>
              <option value="over50">{t("over_$50")}</option>
            </select>

            <select
              className="filter-select"
              value={taxFilter.value}
              onChange={(e) =>
                setTaxFilter({
                  value: e.target.value,
                  label: e.target.options[e.target.selectedIndex].text,
                })
              }
            >
              <option value="all">{t("all_taxes")}</option>
              <option value="low">{t("under_10%")}</option>
              <option value="high">{t("above_10%")}</option>
            </select>

            <button
              className="clear-btn"
              onClick={() => {
                setSearch("");
                setSortBy({ value: "newest", label: "Newest" });
                setPriceFilter({ value: "all", label: "All Prices" });
                setTaxFilter({ value: "all", label: "All Taxes" });
              }}
            >
              {t("clear")}
            </button>
          </div>
        </div>

        <div className="card table-wrapper">
          {loading ? (
            <div className="loading-state">Loading items...</div>
          ) : (
            <ItemsTable
              items={currentItems}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}
        </div>

        <div className="pagination">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {t("previous")}
          </button>

          <span>
            {t("page")} {currentPage} {t("of")} {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t("next")}
          </button>
        </div>
        </>
  );
}

export default ItemsPage;