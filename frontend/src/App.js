import React, { useState } from "react";

const BACKEND_URL = "http://localhost:5050"; // Backend URL

const App = () => {
  const [restaurantId, setRestuarantId] = useState("");
  const [modelId, setModelId] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const createFolderAndUpload = async () => {
    try {
      setStatus("Creating folder...");
      const createFolderRes = await fetch(`${BACKEND_URL}/get-folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rid: restaurantId,
          mid: modelId,
        }),
      });

      const folderResult = await createFolderRes.json();
      const newFolderId = await folderResult.folder_id;
      if (!newFolderId) throw new Error("Failed to create folder");

      setStatus("Requesting token...");
      const tokenRes = await fetch(`${BACKEND_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const { access_token } = await tokenRes.json();

      // Step 2: Upload each file to the new folder
      for (let file of files) {
        const metadata = {
          name: file.name,
          parents: [newFolderId],
        };

        const form = new FormData();
        form.append(
          "metadata",
          new Blob([JSON.stringify(metadata)], { type: "application/json" })
        );
        form.append("file", file);

        setStatus(`Uploading ${file.name}...`);
        await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${access_token}` },
            body: form,
          }
        );
      }

      setStatus("All files uploaded successfully.");
      setFiles([]);
      setRestuarantId("");
      setModelId("");
    } catch (error) {
      console.error(error);
      setStatus("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Upload to Restaurant Folder</h2>
      <input
        type="text"
        placeholder="Enter restuarant name"
        value={restaurantId}
        onChange={(e) => setRestuarantId(e.target.value)}
      />
      <br />
      <br />
      <input
        type="text"
        placeholder="Enter model name"
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
      />
      <br />
      <br />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />
      <br />
      <br />
      <button
        onClick={createFolderAndUpload}
        disabled={!restaurantId || !modelId || files.length === 0}
      >
        Upload
      </button>
      <p>{status}</p>
    </div>
  );
};

export default App;
