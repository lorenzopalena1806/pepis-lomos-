import axios from 'axios';

const API_URL = 'https://pepis-lomos-1.onrender.com/api/';
export const getMenu = async () => {
  try {
    const response = await axios.get(`${API_URL}menu/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching menu:", error);
    return [];
  }
};

export const getStoreStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}store-status/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching store status:", error);
    return { is_open: false, message: "Error de conexión" };
  }
};

export const submitCheckout = async (checkoutData) => {
  try {
    const response = await axios.post(`${API_URL}checkout/`, checkoutData);
    return response.data;
  } catch (error) {
    console.error("Error during checkout:", error);
    throw error.response?.data || error;
  }
};
