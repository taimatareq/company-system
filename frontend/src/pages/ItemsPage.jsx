
// src/pages/ItemsPage.jsx

import { useEffect, useState } from "react";

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

const API_URL = "http://localhost:3001";

function ItemsPage() {

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState(null);

  /* =========================
     FILTERS
  ========================= */

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState({
      value: "newest",
      label: "Newest",
    });

  const [priceFilter, setPriceFilter] =
    useState({
      value: "all",
      label: "All Prices",
    });

  const [taxFilter, setTaxFilter] =
    useState({
      value: "all",
      label: "All Taxes",
    });

  /* =========================
     PAGINATION
  ========================= */

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

  /* =========================
     FETCH ITEMS
  ========================= */

  useEffect(() => {

    fetch(`${API_URL}/items`)
      .then((res) => res.json())
      .then((data) => {

        setItems(data);

        setLoading(false);

      })
      .catch((err) => {

        console.error(err);

        toast.error(
          "Failed to fetch items"
        );

      });

  }, []);

  /* =========================
     RESET FORM
  ========================= */

  const resetForm = () => {

    setEditingItem(null);

    setShowForm(false);

  };

  /* =========================
     DELETE ITEM
  ========================= */

  const handleDelete = (id) => {

    if (
      !window.confirm(
        "Delete this item?"
      )
    ) return;

    fetch(`${API_URL}/items/${id}`, {
      method: "DELETE",
    })
      .then(() => {

        setItems(
          items.filter(
            (item) => item.id !== id
          )
        );

        toast.success(
          "Item deleted successfully"
        );

      })
      .catch((err) => {

        console.error(err);

        toast.error(
          "Failed to delete item"
        );

      });

  };

  /* =========================
     EDIT ITEM
  ========================= */

  const handleEdit = (item) => {

    setEditingItem(item);

    setShowForm(true);

  };

  /* =========================
     SAVE ITEM
  ========================= */

  const handleSave = (itemData) => {

    if (
      Number(
        itemData.retail_tax_rate
      ) < 0 ||

      Number(
        itemData.retail_tax_rate
      ) > 100
    ) {

      toast.error(
        "Retail Tax must be between 0% and 100%"
      );

      return;

    }

    /* UPDATE */

    if (editingItem) {

      fetch(
        `${API_URL}/items/${editingItem.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...itemData,
            id: editingItem.id,
          }),
        }
      )
        .then((res) => res.json())
        .then((updatedItem) => {

          setItems(
            items.map((item) =>
              item.id === updatedItem.id
                ? updatedItem
                : item
            )
          );

          toast.success(
            "Item updated successfully"
          );

          resetForm();

        });

    }

    /* CREATE */

    else {

      const nextId =
        items.length > 0
          ? Math.max(
              ...items.map((item) =>
                Number(item.id)
              )
            ) + 1
          : 1;

      fetch(`${API_URL}/items`, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          ...itemData,
          id: nextId,
        }),
      })
        .then((res) => res.json())
        .then((newItem) => {

          setItems([
            ...items,
            newItem,
          ]);

          toast.success(
            "Item added successfully"
          );

          resetForm();

        });

    }

  };

  /* =========================
     FILTERS
  ========================= */

  let filteredItems =
    items.filter(
      (item) =>
        item.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        item.code
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  /* PRICE FILTER */

  if (
    priceFilter.value ===
    "under50"
  ) {

    filteredItems =
      filteredItems.filter(
        (i) =>
          Number(i.retail_price) < 50
      );

  }

  if (
    priceFilter.value ===
    "over50"
  ) {

    filteredItems =
      filteredItems.filter(
        (i) =>
          Number(i.retail_price) >= 50
      );

  }

  /* TAX FILTER */

  if (taxFilter.value === "low") {

    filteredItems =
      filteredItems.filter(
        (i) =>
          Number(
            i.retail_tax_rate
          ) < 10
      );

  }

  if (taxFilter.value === "high") {

    filteredItems =
      filteredItems.filter(
        (i) =>
          Number(
            i.retail_tax_rate
          ) >= 10
      );

  }

  /* SORTING */

  if (sortBy.value === "newest") {

    filteredItems.sort(
      (a, b) => b.id - a.id
    );

  }

  if (sortBy.value === "oldest") {

    filteredItems.sort(
      (a, b) => a.id - b.id
    );

  }

  if (sortBy.value === "az") {

    filteredItems.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  }

  if (sortBy.value === "za") {

    filteredItems.sort((a, b) =>
      b.name.localeCompare(a.name)
    );

  }

  /* =========================
     PAGINATION
  ========================= */

  const totalPages = Math.ceil(
    filteredItems.length /
      itemsPerPage
  );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const currentItems =
    filteredItems.slice(
      startIndex,
      endIndex
    );

  return (

    <div className="app">

      {/* Sidebar */}

      <aside className="sidebar">

        <h2 className="logo">
          ERP System
        </h2>

        <div className="menu">

          <div className="menu-item active">

            <FaBoxOpen />

            <span>Items</span>

          </div>

          <div className="menu-item">

            <FaWarehouse />

            <span>Inventory</span>

          </div>

          <div className="menu-item">

            <FaShoppingCart />

            <span>Sales</span>

          </div>

        </div>

      </aside>

      {/* Main */}

      <main className="main">

        {/* Header */}

        <div className="page-header">

          <div>

            <h1 className="page-title">
              Items
            </h1>

            <p className="page-subtitle">
              Manage your products
            </p>

          </div>

          {!showForm && (

            <button
              className="add-btn"
              onClick={() =>
                setShowForm(true)
              }
            >

              <FaPlus />

              Add Item

            </button>

          )}

        </div>

        {/* Stats */}

        <div className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon blue">

              <FaBoxes />

            </div>

            <h3>
              {items.length}
            </h3>

            <p>Total Items</p>

          </div>

          <div className="stat-card">

            <div className="stat-icon green">

              <FaDollarSign />

            </div>

            <h3>

              $

              {items
                .reduce(
                  (t, i) =>
                    t +
                    Number(
                      i.retail_price || 0
                    ),
                  0
                )
                .toFixed(2)}

            </h3>

            <p>
              Total Retail Value
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-icon purple">

              <FaFilter />

            </div>

            <h3>
              {filteredItems.length}
            </h3>

            <p>
              Filtered Items
            </p>

          </div>

        </div>

        {/* FORM */}

        {showForm && (

          <div className="card">

            <ItemForm
              editingItem={editingItem}
              onSave={handleSave}
              onCancel={resetForm}
            />

          </div>

        )}

        {/* Filters */}

        <div className="table-header">

          <div className="filters-row">

            <div className="search-box">

              <FaSearch />

              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            <select
              className="filter-select"
              value={sortBy.value}
              onChange={(e) =>
                setSortBy({
                  value:
                    e.target.value,

                  label:
                    e.target.options[
                      e.target.selectedIndex
                    ].text,
                })
              }
            >

              <option value="newest">
                Newest
              </option>

              <option value="oldest">
                Oldest
              </option>

              <option value="az">
                A-Z
              </option>

              <option value="za">
                Z-A
              </option>

            </select>

            <select
              className="filter-select"
              value={priceFilter.value}
              onChange={(e) =>
                setPriceFilter({
                  value:
                    e.target.value,

                  label:
                    e.target.options[
                      e.target.selectedIndex
                    ].text,
                })
              }
            >

              <option value="all">
                All Prices
              </option>

              <option value="under50">
                Under $50
              </option>

              <option value="over50">
                Over $50
              </option>

            </select>

            <select
              className="filter-select"
              value={taxFilter.value}
              onChange={(e) =>
                setTaxFilter({
                  value:
                    e.target.value,

                  label:
                    e.target.options[
                      e.target.selectedIndex
                    ].text,
                })
              }
            >

              <option value="all">
                All Taxes
              </option>

              <option value="low">
                Under 10%
              </option>

              <option value="high">
                Above 10%
              </option>

            </select>

            <button
              className="clear-btn"
              onClick={() => {

                setSearch("");

                setSortBy({
                  value: "newest",
                  label: "Newest",
                });

                setPriceFilter({
                  value: "all",
                  label: "All Prices",
                });

                setTaxFilter({
                  value: "all",
                  label: "All Taxes",
                });

              }}
            >

              Clear

            </button>

          </div>

        </div>

        {/* Table */}

        <div className="card table-wrapper">

          {loading ? (

            <div className="loading-state">
              Loading items...
            </div>

          ) : (

            <ItemsTable
              items={currentItems}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />

          )}

        </div>

        {/* Pagination */}

        <div className="pagination">

          <button
            onClick={() =>
              setCurrentPage(
                currentPage - 1
              )
            }
            disabled={
              currentPage === 1
            }
          >
            Previous
          </button>

          <span>

            Page {currentPage} of{" "}
            {totalPages}

          </span>

          <button
            onClick={() =>
              setCurrentPage(
                currentPage + 1
              )
            }
            disabled={
              currentPage ===
              totalPages
            }
          >
            Next
          </button>

        </div>

      </main>

    </div>

  );

}

export default ItemsPage;

