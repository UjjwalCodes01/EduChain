const { create } = require('ipfs-http-client');

// Initialize IPFS client
let ipfs;

const initIPFS = () => {
  try {
    const rawProjectId = process.env.IPFS_PROJECT_ID;
    const rawProjectSecret = process.env.IPFS_PROJECT_SECRET;
    const endpoint = (process.env.IPFS_ENDPOINT || 'https://ipfs.infura.io:5001').trim();

    if (!rawProjectId || !rawProjectSecret) {
      console.warn('⚠️  IPFS credentials not configured. IPFS functionality will be limited.');
      return null;
    }

    const projectId = rawProjectId.trim();
    const projectSecret = rawProjectSecret.trim();

    // Log masked project id so you can verify the correct env var is read
    console.log(`🔐 IPFS project id detected: ${projectId.substring(0,6)}...${projectId.slice(-4)}`);

    const auth = 'Basic ' + Buffer.from(`${projectId}:${projectSecret}`).toString('base64');

    // Use `url` option (recommended) instead of host/port/protocol
    ipfs = create({
      url: endpoint,
      headers: { authorization: auth }
    });

    // Quick validation of client (async check)
    ipfs._readyCheck = (async () => {
      try {
        // Minimal call to validate credentials and reachability
        const id = await ipfs.id();
        console.log('✅ IPFS client initialized (node id):', id.id ? id.id.substring(0,8) + '...' : id);
        return true;
      } catch (err) {
        console.error('❌ IPFS client validation failed:', err && err.message ? err.message : err);
        // Destroy client so subsequent calls re-init or fail
        ipfs = null;
        return false;
      }
    })();

    return ipfs;
  } catch (error) {
    console.error('❌ Failed to initialize IPFS client:', error);
    ipfs = null;
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

    if (ipfs && ipfs._readyCheck) {
      await ipfs._readyCheck;
    }

    if (!ipfs) {
      const msg = 'IPFS client not available';
      console.warn('⚠️  ' + msg + '.');

      if (process.env.NODE_ENV === 'production') {
        throw new Error(msg);
      }

      // Return a mock CID for development
      return 'Qm' + Buffer.from(Date.now().toString()).toString('base64').substring(0, 44);
    }

    const file = {
      path: filename,
      content: fileBuffer
    };

    const result = await ipfs.add(file);
    const cid = (result && (result.cid?.toString() || result.path || result.cid)) || null;
    
    console.log(`✅ File uploaded to IPFS: ${cid}`);
    return cid;
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error);
    if (process.env.NODE_ENV === 'production') throw error;
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

    if (ipfs && ipfs._readyCheck) {
      await ipfs._readyCheck;
    }

    if (!ipfs) {
      const msg = 'IPFS client not available for JSON upload';
      console.warn('⚠️  ' + msg + '.');
      if (process.env.NODE_ENV === 'production') {
        throw new Error(msg);
      }
      return 'Qm' + Buffer.from(JSON.stringify(data).substring(0, 20) + Date.now()).toString('base64').substring(0, 44);
    }

    const jsonString = JSON.stringify(data);
    const buffer = Buffer.from(jsonString);

    const result = await ipfs.add(buffer);
    const cid = (result && (result.cid?.toString() || result.path || result.cid)) || null;
    
    console.log(`✅ JSON uploaded to IPFS: ${cid}`);
    return cid;
  } catch (error) {
    console.error('❌ Error uploading JSON to IPFS:', error);
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
