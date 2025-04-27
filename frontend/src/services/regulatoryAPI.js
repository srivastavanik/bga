import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * Generate a regulatory analysis report using Claude
 * @param {Object} params - Analysis parameters
 * @param {string} params.smiles - SMILES string of the molecule
 * @param {string} params.drugClass - Drug classification
 * @param {string} params.targetIndication - Target indication/disease
 * @param {string} params.primaryMechanism - Primary mechanism of action
 * @param {boolean} params.novelMechanism - Whether this is a novel mechanism
 * @param {boolean} params.orphanDrug - Whether this is an orphan drug
 * @param {boolean} params.fastTrack - Whether this qualifies for fast track
 * @returns {Promise} - Promise with the regulatory report data
 */
export const generateRegulatoryReport = async (params) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/regulatory/report`, params);
    return response.data;
  } catch (error) {
    console.error('Error generating regulatory report:', error);
    throw error;
  }
};

/**
 * Get patent information for a molecule or drug class
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (molecule name, class, etc.)
 * @returns {Promise} - Promise with patent information
 */
export const getPatentInformation = async (params) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/regulatory/patents`, params);
    return response.data;
  } catch (error) {
    console.error('Error fetching patent information:', error);
    throw error;
  }
};

export default {
  generateRegulatoryReport,
  getPatentInformation
}; 