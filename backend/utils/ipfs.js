const axios = require('axios');
const FormData = require('form-data');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const pinataBaseUrl = 'https://api.pinata.cloud/pinning';

/**
 * Initialize Pinata (validation check)
 */
const initIPFS = () => {
  try {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      console.warn('⚠️  Pinata credentials not configured. IPFS functionality will be limited.');
      return false;
    }

    console.log('✅ Pinata IPFS client initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Pinata client:', error);
    return false;
  }
};

/**
 * Upload a file to IPFS via Pinata
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {String} filename - Original filename
 * @returns {Promise<String>} - IPFS CID hash
 */
const uploadToIPFS = async (fileBuffer, filename = 'document') => {
  try {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      const msg = 'Pinata credentials not configured';
      console.warn('⚠️  ' + msg);

      if (process.env.NODE_ENV === 'production') {
        throw new Error(msg);
      }

      // Return a mock CID for development
      return 'Qm' + Buffer.from(Date.now().toString()).toString('base64').substring(0, 44);
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, filename);

    const response = await axios.post(`${pinataBaseUrl}/pinFileToIPFS`, formData, {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });

    const cid = response.data.IpfsHash;
    console.log(`✅ File uploaded to IPFS via Pinata: ${cid}`);
    return cid;
  } catch (error) {
    console.error('❌ Error uploading file to Pinata:', error.response?.data || error.message);
    if (process.env.NODE_ENV === 'production') throw error;
    console.warn('⚠️  Returning mock CID due to upload error.');
    return 'Qm' + Buffer.from(Date.now().toString()).toString('base64').substring(0, 44);
  }
};

/**
 * Upload JSON data to IPFS via Pinata
 * @param {Object} data - JSON data to upload
 * @returns {Promise<String>} - IPFS CID hash
 */
const uploadJSONToIPFS = async (data) => {
  try {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      const msg = 'Pinata credentials not configured for JSON upload';
      console.warn('⚠️  ' + msg);

      if (process.env.NODE_ENV === 'production') {
        throw new Error(msg);
      }

      return 'Qm' + Buffer.from(JSON.stringify(data).substring(0, 20) + Date.now()).toString('base64').substring(0, 44);
    }

    const response = await axios.post(`${pinataBaseUrl}/pinJSONToIPFS`, data, {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });

    const cid = response.data.IpfsHash;
    console.log(`✅ JSON uploaded to IPFS via Pinata: ${cid}`);
    return cid;
  } catch (error) {
    console.error('❌ Error uploading JSON to Pinata:', error.response?.data || error.message);
    if (process.env.NODE_ENV === 'production') throw error;
    console.warn('⚠️  Returning mock CID due to JSON upload error.');
    return 'Qm' + Buffer.from(JSON.stringify(data).substring(0, 20) + Date.now()).toString('base64').substring(0, 44);
  }
};

/**
 * Get IPFS gateway URL for a CID
 * @param {String} cid - IPFS CID hash
 * @returns {String} - Full IPFS gateway URL
 */
const getIPFSUrl = (cid) => {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
};

module.exports = {
  initIPFS,
  uploadToIPFS,
  uploadJSONToIPFS,
  getIPFSUrl
};
