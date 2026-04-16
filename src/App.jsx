import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Search, RefreshCw, Upload, CheckCircle } from 'lucide-react';

// --- CONFIGURATION ---
// 1. Replace with your actual API Gateway Stage URL
const API_URL = "https://v1j5xje9z2.execute-api.eu-north-1.amazonaws.com/images"; 
// 2. Replace with your actual Resized S3 Bucket URL
const RESIZED_BUCKET_URL = "https://smart-gallery-resized.s3.eu-north-1.amazonaws.com/";

function App() {
  const [images, setImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    fetchImages();
  }, []);

  // FETCH: Get all metadata from DynamoDB via API Gateway
  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setImages(response.data);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  // NEW FEATURE: Upload directly to S3 via Presigned URL
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setStatusMsg("Requesting secure upload link...");

    try {
      // 1. Ask Lambda for a Presigned URL (POST to your /upload route)
      // Note: Ensure your API Gateway has a POST route mapped to the 'get-upload-url' Lambda
      const { data } = await axios.post(`${API_URL}/upload`, { 
        fileName: file.name,
        fileType: file.type 
      });

      setStatusMsg("Uploading directly to S3...");
      
      // 2. Upload the file binary directly to S3
      await axios.put(data.uploadUrl, file, {
        headers: { "Content-Type": file.type }
      });

      setStatusMsg("Processing AI Labels... Please wait.");
      
      // 3. Wait a few seconds for the Lambda trigger to finish, then refresh
      setTimeout(() => {
        fetchImages();
        setStatusMsg("Gallery Updated!");
        setTimeout(() => setStatusMsg(""), 3000);
      }, 5000);

    } catch (error) {
      console.error("Upload failed:", error);
      setStatusMsg("Upload failed. Check CORS/Permissions.");
    } finally {
      setUploading(false);
    }
  };

  const filteredImages = images.filter(img => 
    img.labels?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          <ImageIcon size={40} color="#2563eb" /> Smart AI Gallery
        </h1>
        <p style={styles.subtitle}>Serverless Image Processing Pipeline</p>
        
        <div style={styles.controls}>
          {/* Search Bar */}
          <div style={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="Search by AI labels (e.g. 'Car', 'Dog')..." 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <Search style={styles.searchIcon} size={20} />
          </div>

          {/* Upload Button */}
          <label style={{...styles.uploadBtn, opacity: uploading ? 0.6 : 1}}>
            {uploading ? <RefreshCw size={20} className="animate-spin" /> : <Upload size={20} />}
            {uploading ? "Uploading..." : "Upload Image"}
            <input type="file" onChange={handleUpload} hidden accept="image/*" disabled={uploading} />
          </label>
        </div>

        {statusMsg && (
          <p style={styles.statusText}>
            <CheckCircle size={16} color="#10b981" /> {statusMsg}
          </p>
        )}
      </header>

      <hr style={styles.divider} />

      {loading ? (
        <div style={styles.center}><RefreshCw className="animate-spin" /> <p>Loading Gallery...</p></div>
      ) : (
        <div style={styles.grid}>
          {filteredImages.map((img) => (
            <div key={img.imageid} style={styles.card}>
              <img 
                src={`${RESIZED_BUCKET_URL}${img.thumbnailKey}`} 
                alt={img.labels} 
                style={styles.image}
                onError={(e) => e.target.src = "https://via.placeholder.com/400x300?text=Processing..."}
              />
              <div style={styles.cardContent}>
                <p style={styles.date}>{new Date(img.uploadDate).toLocaleDateString()}</p>
                <div style={styles.labelWrapper}>
                  {img.labels?.split(',').map(label => (
                    <span key={label} style={styles.badge}>{label.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredImages.length === 0 && !loading && (
        <p style={styles.center}>No images found matching "{searchTerm}"</p>
      )}
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: { padding: '40px 20px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'system-ui' },
  header: { textAlign: 'center', marginBottom: '40px' },
  title: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontSize: '2.8rem', color: '#111827' },
  subtitle: { color: '#6b7280', fontSize: '1.1rem', marginTop: '-10px' },
  controls: { display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px', flexWrap: 'wrap' },
  searchWrapper: { position: 'relative', width: '100%', maxWidth: '500px' },
  searchInput: { width: '100%', padding: '14px 45px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '1rem' },
  searchIcon: { position: 'absolute', left: '15px', top: '15px', color: '#9ca3af' },
  uploadBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' },
  statusText: { marginTop: '15px', color: '#059669', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
  divider: { border: '0', height: '1px', backgroundColor: '#e5e7eb', margin: '40px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', maxWidth: '1200px', margin: '0 auto' },
  card: { backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  image: { width: '100%', height: '240px', objectFit: 'cover' },
  cardContent: { padding: '20px' },
  date: { fontSize: '0.8rem', color: '#9ca3af', marginBottom: '10px' },
  labelWrapper: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  badge: { backgroundColor: '#eff6ff', color: '#1e40af', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500' },
  center: { textAlign: 'center', color: '#6b7280', marginTop: '50px' }
};

export default App;