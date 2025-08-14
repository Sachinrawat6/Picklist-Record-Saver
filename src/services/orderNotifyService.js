import axios from "axios";

const sendOrdersSummaryToEmail = async (data) => {
    try {
        const response = await axios.post(
            "https://inventorybackend-m1z8.onrender.com/api/v1/order/send",
            data,
            { headers: { "Content-Type": "application/json" } }
        );
        return response.data;
    } catch (error) {
        console.error("API error while sending orders to email:", error?.response?.data || error.message);
        throw error;
    }
};

export default sendOrdersSummaryToEmail;
