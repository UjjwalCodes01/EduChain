const { create } = require('ipfs-http-client');

// Initialize IPFS client
let ipfs;

const initIPFS = () => {
  try {
    if (!process.env.IPFS_PROJECT_ID || !process.env.IPFS_PROJECT_SECRET) {
      console.warn('⚠️  IPFS credentials not configured. IPFS functionality will be limited.');
      return null;
    }

    const auth = 'Basic ' + Buffer.from(
      process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET
    ).toString('base64');

    ipfs = create({
      host: process.env.IPFS_HOST || 'ipfs.infura.io',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'https',
      headers: { authorization: auth }
    });

    console.log('✅ IPFS client initialized');
    return ipfs;
  } catch (error) {
    console.error('❌ Failed to initialize IPFS client:', error);
    return null;
  }
};

/**
 * Upload a file to IPFS
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {String} filename - Original filename
 * @returns {Promise<String>} - IPFS CID hash
 */
const uploadToIPFS = async (fileBuffer, filename = 'document') => {
  try {
    if (!ipfs) {
      ipfs = initIPFS();
    }

    if (!ipfs) {
      console.warn('⚠️  IPFS client not available. Returning mock CID.');
      // Return a mock CID for development
      return 'Qm' + Buffer.from(Date.now().toString()).toString('base64').substring(0, 44);
    }

    const file = {
      path: filename,
      content: fileBuffer
    };

    const result = await ipfs.add(file);
    const cid = result.cid.toString();
    
    console.log(`✅ File uploaded to IPFS: ${cid}`);
    return cid;
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error);
    // Return mock CID on error for development
    console.warn('⚠️  Returning mock CID due to upload error.');
    return 'Qm' + Buffer.from(Date.now().toString()).toString('base64').substring(0, 44);
  }
};

/**
 * Upload JSON data to IPFS
 * @param {Object} data - JSON data to upload
 * @returns {Promise<String>} - IPFS CID hash
 */
const uploadJSONToIPFS = async (data) => {
  try {
    if (!ipfs) {
      ipfs = initIPFS();
    }

    if (!ipfs) {
      throw new Error('IPFS client not initialized');
    }

    const jsonString = JSON.stringify(data);
    const buffer = Buffer.from(jsonString);

    const result = await ipfs.add(buffer);
    const cid = result.cid.toString();
    
    console.log(`JSON uploaded to IPFS: ${cid}`);
    return cid;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
};

/**
 * Get IPFS gateway URL for a CID
 * @param {String} cid - IPFS CID hash
 * @returns {String} - Full IPFS gateway URL
 */
const getIPFSUrl = (cid) => {
  return `https://ipfs.io/ipfs/${cid}`;
};

/**
 * Pin a file to keep it available on IPFS
 * @param {String} cid - IPFS CID hash to pin
 */
const pinToIPFS = async (cid) => {
  try {
    if (!ipfs) {
      ipfs = initIPFS();
    }

    if (!ipfs) {
      throw new Error('IPFS client not initialized');
    }

    await ipfs.pin.add(cid);
    console.log(`Pinned to IPFS: ${cid}`);
  } catch (error) {
    console.error('Error pinning to IPFS:', error);
    // Don't throw - pinning is optional
  }
};

module.exports = {
  initIPFS,
  uploadToIPFS,
  uploadJSONToIPFS,
  getIPFSUrl,
  pinToIPFS
};
