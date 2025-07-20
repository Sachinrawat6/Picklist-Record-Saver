import axios from "axios"
  const syncOrdersToNocoDb = async (orders,patternData) => {
    
    try {
      const payload = orders.map((order) => ({
        // channel: order.channel || "",
        channel:  "Test",
        style_number: Number(order.style_number) || "",
        size: order.size || "",
        color:
          patternData.find(
            (color) => Number(color.style_number) === Number(order.style_number)
          )?.color || "",
        status: order?.status || "",
        found_in_inventory:
          order.status?.toLowerCase().includes("found") ||
          order.status?.toLowerCase().includes("alter")
            ? true
            : false,
      }));

      const apiUrl = "https://fastapi.qurvii.com/sync-orders";

      const response = await axios.post(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      alert(`${orders.length} synced succsessfully.`);
      return response.data;
    } catch (err) {
      console.log("Failed to sync orders", err);
    }
  };

  export default syncOrdersToNocoDb;