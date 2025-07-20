import axios from 'axios';

const API_BASE_URL = 'https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records';
const API_TOKEN = '-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1';

export const fetchOrdersFromPicklistResponse = async (picklistId) => {
  const allOrders = [];
  let offset = 0;
  const limit = 100;

  try {
    while (true) {
      const url = `${API_BASE_URL}?where=(picklist_id,eq,${Number(picklistId)})&limit=${limit}&offset=${offset}`;

      const response = await axios.get(url, {
        headers: {
          'xc-token': API_TOKEN,
        },
      });

      const fetchedOrders = response.data.list || [];
      allOrders.push(...fetchedOrders);

      if (fetchedOrders.length < limit) {
        // No more pages to fetch
        break;
      }

      offset += limit;
    }

    return allOrders;
  } catch (err) {
    console.error('Error fetching orders:', err);
    throw new Error('Failed to fetch orders');
  }
};
