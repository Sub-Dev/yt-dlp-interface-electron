import { useState } from 'react';
export default function Home() {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState('');
    const [output, setOutput] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setOutput('Downloading...');
        try {
            const result = await window.electronAPI.downloadVideo({ url, options: { format } });
            setOutput(result);
        }
        catch (error) {
            setOutput('Error: ' + error);
        }
    };
    return (<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>yt-dlp Downloader</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Enter video URL" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: '80%', padding: '10px', marginBottom: '10px' }} required/>
        <br />
        <input type="text" placeholder="Optional format (e.g., best)" value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: '80%', padding: '10px', marginBottom: '10px' }}/>
        <br />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>
          Download
        </button>
      </form>
      <pre style={{ background: '#f4f4f4', padding: '10px', marginTop: '20px' }}>{output}</pre>
    </div>);
}
