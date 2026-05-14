
import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

function ItemsTable({
  items,
  onDelete,
  onEdit,
}) {

  if (items.length === 0) {

    return (

      <div className="empty-state">

        <div className="empty-icon">
          📦
        </div>

        <h3>
          No items found
        </h3>

        <p>
          Try changing filters
          or add a new item.
        </p>

      </div>

    );

  }

  return (

    <table>

      <thead>

        <tr>

          <th>ID</th>

          <th>NAME</th>

          <th>CODE</th>

          <th>RETAIL PRICE</th>

          <th>RETAIL TAX</th>

          <th>ACTIONS</th>

        </tr>

      </thead>

      <tbody>

        {items.map((item) => (

          <tr key={item.id}>

            <td>
              {item.id}
            </td>

            <td>
              {item.name}
            </td>

            <td>
              {item.code}
            </td>

            <td>
              $
              {item.retail_price}
            </td>

            <td>
              {item.retail_tax_rate}%
            </td>


            {/* ACTIONS */}

            <td>

              <div className="actions-group">

                <button
                  className="edit-btn"
                  onClick={() =>
                    onEdit(item)
                  }
                  title="Edit Item"
                >

                  <FaEdit />

                </button>

                <button
                  className="delete-btn"
                  onClick={() =>
                    onDelete(item.id)
                  }
                  title="Delete Item"
                >

                  <FaTrash />

                </button>

              </div>

            </td>

          </tr>

        ))}

      </tbody>

    </table>

  );

}

export default ItemsTable;

