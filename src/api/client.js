import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.BNG_URL,
  headers: {'X-API-Key': process.env.API_KEY }
});


/**
 * @param {string} url 
 * @returns {Promise<[Error, null] | [null, any]>}
 */
async function apiGet(url) {
  let data = null, error = null;
  try {
    data = (await apiClient.get('/Platform' + url)).data;
  } catch (err) {
    error = err;
  }

  return [error, data];
}

/**
 * @param {string} url 
 * @param {object} body 
 * @returns {Promise<[Error, null] | [null, any]>}
 */
async function apiPost(url, body) {
  let data = null, error = null;
  // /Destiny2/SearchDestinyPlayerByBungieName/{membershipType}/
  try {
    data = (await apiClient.post('/Platform' + url, body)).data;
  } catch (err) {
    error = err;
  }
  return [error, data];
}

export { apiClient, apiGet, apiPost };