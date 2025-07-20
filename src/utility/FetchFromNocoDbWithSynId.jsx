import axios from "axios";

const fetchOrdersFromNocoDbWithSyncId = async(sync_id)=>{
    
const options = {
  method: 'GET',
  url: 'https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records',
  params: { limit: '1000', where: `(sync_id,eq,${sync_id})`, viewId: 'vwi961elxbm8g0gr'},
  headers: {
    'xc-token': 'LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK'
  }
};
try {
    const response = await axios.request(options);
    return response.data.list || [];
    
} catch (error) {
    console.log("Failed to fetch orders from nocodb ",error);
}

}

export default fetchOrdersFromNocoDbWithSyncId;

