"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
function Home() {
    const [url, setUrl] = (0, react_1.useState)("");
    const [videoFormats, setVideoFormats] = (0, react_1.useState)([]);
    const [audioFormats, setAudioFormats] = (0, react_1.useState)([]);
    const [subtitles, setSubtitles] = (0, react_1.useState)([]);
    const [selectedVideo, setSelectedVideo] = (0, react_1.useState)("");
    const [selectedAudio, setSelectedAudio] = (0, react_1.useState)("");
    const [selectedSubtitle, setSelectedSubtitle] = (0, react_1.useState)("");
    const [output, setOutput] = (0, react_1.useState)("");
    const handleCheckInfo = async () => {
        try {
            console.log(window.electronAPI);
            const result = await window.electronAPI.getVideoInfo(url);
            setVideoFormats(result.videoFormats);
            setAudioFormats(result.audioFormats);
            setSubtitles(result.subtitles);
        }
        catch (error) {
            console.error("Erro ao obter informações:", error);
            setOutput(`Erro ao obter informações do vídeo: ${error.message || error}`);
        }
    };
    const handleDownload = async () => {
        setOutput("Baixando...");
        try {
            const format = selectedVideo || selectedAudio;
            const result = await window.electronAPI.downloadVideo({ url, options: { format } });
            setOutput(result);
        }
        catch (error) {
            setOutput("Erro no download");
        }
    };
    return (<div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>yt-dlp Downloader</h1>
      <input type="text" placeholder="Enter video URL" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "80%", padding: "10px", marginBottom: "10px", color: "black" }} required/>
      <button onClick={handleCheckInfo} style={{ padding: "10px 20px", fontSize: "16px", marginLeft: "10px" }}>
        Verificar
      </button>

      {videoFormats.length > 0 && (<>
          <h3>Qualidade do Vídeo</h3>
          <select value={selectedVideo} onChange={(e) => setSelectedVideo(e.target.value)}>
            <option value="">Nenhum (apenas áudio)</option>
            {videoFormats.map((format) => (<option key={format.format_id} value={format.format_id}>
                {format.resolution} - {format.ext}
              </option>))}
          </select>
        </>)}

      {audioFormats.length > 0 && (<>
          <h3>Faixa de Áudio</h3>
          <select value={selectedAudio} onChange={(e) => setSelectedAudio(e.target.value)}>
            <option value="">Nenhum</option>
            {audioFormats.map((format) => (<option key={format.format_id} value={format.format_id}>
                {format.abr} - {format.ext}
              </option>))}
          </select>
        </>)}

      {subtitles.length > 0 && (<>
          <h3>Legendas</h3>
          <select value={selectedSubtitle} onChange={(e) => setSelectedSubtitle(e.target.value)}>
            <option value="">Nenhuma</option>
            {subtitles.map((subtitle) => (<option key={subtitle.lang} value={subtitle.lang}>
                {subtitle.lang}
              </option>))}
          </select>
        </>)}

      <button onClick={handleDownload} style={{ padding: "10px 20px", fontSize: "16px", marginTop: "10px" }}>
        Baixar
      </button>

      <pre style={{ background: "#f4f4f4", padding: "10px", marginTop: "20px", color: "black" }}>{output}</pre>
    </div>);
}
