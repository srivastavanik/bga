import axios from 'axios';

export const regulatoryAPI = {
  generateRegulatoryReport: (params) =>
    axios
      .post('/api/regulatory-report', params)
      .then(res => res.data)
      .catch(err => {
        console.error(err);
        throw err;
      })
}; 