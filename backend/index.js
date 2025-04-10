const express = require("express");
const { google } = require("googleapis");
const drive = google.drive("v3");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const KEYFILE = path.join(__dirname, "credientials.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const PARENT_FOLDER_ID = "1reYtpcJC5Rr_X5WeTniD1PRGUanWTUqG";

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
  scopes: SCOPES,
});

app.post("/token", async (req, res) => {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    res.json({ access_token: tokenResponse.token });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to generate token", details: err.message });
  }
});

app.post("/get-folder", async (req, res) => {
  const { rid, mid } = req.body;

  try {
    const restuarant_folder_id = await createFolderIfNotExist(
      rid,
      PARENT_FOLDER_ID
    );
    const model_folder_id = await createFolderIfNotExist(
      mid,
      restuarant_folder_id
    );
    res.json({ folder_id: model_folder_id });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create folder", details: err.message });
  }
});

async function createFolderIfNotExist(folderName, parentFolderId) {
  // Check if folder exists
  const res = await drive.files.list({
    auth,
    q: `name = '${folderName}' and '${parentFolderId}' in parents`,
    fields: "files(id, name)",
  });

  if (res.data.files.length === 0) {
    // Folder does not exist, create it
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    };
    const file = await drive.files.create({
      auth,
      resource: fileMetadata,
      fields: "id, name, parents",
    });

    return file.data.id;
  }

  return res.data.files[0].id; // Folder exists, return its ID
}

app.listen(5050, () => {
  console.log("Backend server running on http://localhost:5050");
});
