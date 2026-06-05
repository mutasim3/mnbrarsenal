import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const DEFAULT_INSTAGRAM_ACCESS_TOKEN = "EAAoNleQ6B1ABRgaaWHmG8bXYNnMILLuI0H52cuZBE1cWRQltbfJgn72q66pTcYZAzmZBt7OFUgDBG3O6mZB6ILlJPzH64A1dBCl7dD6FlsZA3h0XW9hZC3n6gMulG0TcS5kQUSY5pw2dGc1neKeTjdDZAL3hlTHDEDqPOfuyvAs4aKWMRLhs3csaJbjZC9ZBjIAZDZD";
const DEFAULT_INSTAGRAM_ID = "17841429813774366";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || DEFAULT_INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_ID = process.env.INSTAGRAM_ID || DEFAULT_INSTAGRAM_ID;

// In-memory cache for temporary images and videos to be read by Instagram's servers
// Stores: id -> base64 data
const tempImageCache = new Map<string, string>();
const tempVideoCache = new Map<string, string>();

// Upload temp buffer to public image/video host to bypass authorization wall for Meta crawlers
async function uploadToPublicHost(buffer: Buffer, mimeType: string = "image/jpeg", filename: string = "sports-post.jpg"): Promise<string> {
  console.log(`Attempting to upload sports media (${mimeType}) to public anonymous file host...`);

  // Method 1: tmpfiles.org
  try {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("file", blob, filename);

    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      if (result && result.status === "success" && result.data && result.data.url) {
        const rawUrl = result.data.url;
        const directUrl = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");
        console.log(`Uploaded successfully to tmpfiles.org: ${directUrl}`);
        return directUrl;
      }
    }
    console.warn("tmpfiles.org upload returned non-success status", response.status);
  } catch (err) {
    console.error("Failed to upload to tmpfiles.org:", err);
  }

  // Method 2: catbox.moe
  try {
    console.log("Attempting backup upload to catbox.moe...");
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", blob, filename);

    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const directUrl = await response.text();
      if (directUrl && directUrl.startsWith("http")) {
        console.log(`Uploaded successfully to catbox.moe: ${directUrl}`);
        return directUrl.trim();
      }
    }
    console.warn("catbox.moe upload returned non-success status", response.status);
  } catch (err) {
    console.error("Failed to upload to catbox.moe:", err);
  }

  throw new Error("All public cloud image/video uploads failed.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support reading JSON bodies up to 100MB for media files and videos
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Dynamic Image endpoint for Meta Graph API to fetch
  app.get("/api/temp-images/:id.png", (req, res) => {
    const id = req.params.id;
    const base64Data = tempImageCache.get(id);

    if (!base64Data) {
      console.error(`Temporary image not found: ${id}`);
      return res.status(404).send("Image not found");
    }

    try {
      // Decode base64
      let cleanBase64 = base64Data;
      if (base64Data.includes(";base64,")) {
        cleanBase64 = base64Data.split(";base64,")[1];
      }
      const buffer = Buffer.from(cleanBase64, "base64");
      
      // Auto-detect JPEG vs PNG for Meta crawler content safety
      if (cleanBase64.startsWith("/9j/")) {
        res.setHeader("Content-Type", "image/jpeg");
      } else {
        res.setHeader("Content-Type", "image/png");
      }
      res.setHeader("Cache-Control", "public, max-age=600");
      return res.send(buffer);
    } catch (err) {
      console.error("Error serving temp image", err);
      return res.status(500).send("Error rendering image");
    }
  });

  // Dynamic Video (MP4) endpoint for Meta Graph API to fetch Reels
  app.get("/api/temp-videos/:id.mp4", (req, res) => {
    const id = req.params.id;
    const base64Data = tempVideoCache.get(id);

    if (!base64Data) {
      console.error(`Temporary video cache item not found: ${id}`);
      return res.status(404).send("Video file not found");
    }

    try {
      // Decode base64 video
      let cleanBase64 = base64Data;
      if (base64Data.includes(";base64,")) {
        cleanBase64 = base64Data.split(";base64,")[1];
      }
      const buffer = Buffer.from(cleanBase64, "base64");

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Cache-Control", "public, max-age=600");
      res.setHeader("Accept-Ranges", "bytes");
      return res.send(buffer);
    } catch (err) {
      console.error("Error serving temp video chunk", err);
      return res.status(500).send("Error rendering video");
    }
  });

  // Instagram profile details proxy endpoint
  app.get("/api/instagram/profile", async (req, res) => {
    try {
      const url = `https://graph.facebook.com/v20.0/${INSTAGRAM_ID}?fields=username,name,profile_picture_url,followers_count,media_count,biography&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Graph API returned error: ${errText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Failed to fetch Instagram profile", error);
      res.status(500).json({ error: error.message || "Failed to load profile" });
    }
  });

  // Instagram recent media list proxy endpoint
  app.get("/api/instagram/recent-media", async (req, res) => {
    try {
      const url = `https://graph.facebook.com/v20.0/${INSTAGRAM_ID}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count&limit=12&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Graph API returned error: ${errText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Failed to fetch recent Instagram media", error);
      res.status(500).json({ error: error.message || "Failed to load recent posts" });
    }
  });

  // Instagram auto posting endpoint
  app.post("/api/instagram/publish", async (req, res) => {
    const { imageDataUri, caption, publicOrigin } = req.body;

    if (!imageDataUri) {
      return res.status(400).json({ error: "Missing required image content" });
    }

    try {
      // 1. Generate unique key and cache the base64 image on our server temporarily
      const id = crypto.randomUUID();
      tempImageCache.set(id, imageDataUri);

      // Automatically clean it up after 15 minutes to save memory
      setTimeout(() => {
        tempImageCache.delete(id);
      }, 15 * 60 * 1000);

      // Parse and decode base64 URI into a Buffer
      let cleanBase64 = imageDataUri;
      if (imageDataUri.includes(";base64,")) {
        cleanBase64 = imageDataUri.split(";base64,")[1];
      }
      const buffer = Buffer.from(cleanBase64, "base64");

      // Host the image on a fully public anonymous server so Meta's scraper can pull it without authorization walls
      let publicImageUrl = "";
      try {
        publicImageUrl = await uploadToPublicHost(buffer);
      } catch (uploadError: any) {
        console.warn("Public image host upload failed, falling back to local server hosting...", uploadError);
        // Fallback to local server address if our public hosting fails
        if (publicOrigin) {
          publicImageUrl = `${publicOrigin}/api/temp-images/${id}.png`;
        } else {
          const host = req.get("host") || "localhost:3000";
          const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
          publicImageUrl = `${protocol}://${host}/api/temp-images/${id}.png`;
        }
      }

      console.log(`Hosted temp image for Meta at: ${publicImageUrl}`);

      // 2. Register media container on Meta
      const createContainerUrl = `https://graph.facebook.com/v20.0/${INSTAGRAM_ID}/media`;
      const containerResponse = await fetch(createContainerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: publicImageUrl,
          caption: caption || "",
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      });

      if (!containerResponse.ok) {
        const errorText = await containerResponse.text();
        console.error("Container creation failed", errorText);
        return res.status(500).json({ error: `Meta media creation failed: ${errorText}` });
      }

      const { id: creationId } = await containerResponse.json();
      console.log(`Meta Media container created with ID: ${creationId}`);

      // Wait 3 seconds to let Instagram process the image from our hosted URL before triggering publish
      await new Promise((resolve) => setTimeout(resolve, 3100));

      // 3. Publish the container
      const publishUrl = `https://graph.facebook.com/v20.0/${INSTAGRAM_ID}/media_publish`;
      const publishResponse = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      });

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        console.error("Meta publish failed", errorText);
        return res.status(500).json({ error: `Meta publishing failed: ${errorText}` });
      }

      const { id: mediaId } = await publishResponse.json();
      console.log(`Instagram publication completed! Post ID: ${mediaId}`);

      // 4. Retrieve post permalink for elegant UX
      let permalink = `https://www.instagram.com/`;
      try {
        const getPostUrl = `https://graph.facebook.com/v20.0/${mediaId}?fields=permalink&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
        const postInfoRes = await fetch(getPostUrl);
        if (postInfoRes.ok) {
          const postData = await postInfoRes.json();
          permalink = postData.permalink || permalink;
        }
      } catch (err) {
        console.warn("Could not fetch permalink for newly created post", err);
      }

      // 5. Instantly garbage collect our memory
      tempImageCache.delete(id);

      return res.json({
        success: true,
        mediaId,
        permalink,
        message: "تم النشر بنجاح على حساب منبر أرسنال!"
      });

    } catch (error: any) {
      console.error("Failed to post to Instagram", error);
      return res.status(500).json({ error: error.message || "An error occurred while publishing to Instagram" });
    }
  });

  // Instagram Reel video publishing endpoint
  app.post("/api/instagram/publish-reel", async (req, res) => {
    const { videoDataUri, caption, publicOrigin } = req.body;

    if (!videoDataUri) {
      return res.status(400).json({ error: "Missing required video content" });
    }

    try {
      console.log("Initializing Reels publishing pipeline...");
      // 1. Host video in cache
      const id = crypto.randomUUID();
      tempVideoCache.set(id, videoDataUri);

      // Clean up cache after 20 minutes to allow time for processing
      setTimeout(() => {
        tempVideoCache.delete(id);
      }, 20 * 60 * 1000);

      // Decode base64 to buffer
      let cleanBase64 = videoDataUri;
      if (videoDataUri.includes(";base64,")) {
        cleanBase64 = videoDataUri.split(";base64,")[1];
      }
      const buffer = Buffer.from(cleanBase64, "base64");

      // Host the video on fully public anonymous server so Meta's crawler can pull it
      let publicVideoUrl = "";
      try {
        publicVideoUrl = await uploadToPublicHost(buffer, "video/mp4", "sports-reel.mp4");
      } catch (uploadError: any) {
        console.warn("Public host video upload failed, using local hosting...", uploadError);
        if (publicOrigin) {
          publicVideoUrl = `${publicOrigin}/api/temp-videos/${id}.mp4`;
        } else {
          const host = req.get("host") || "localhost:3000";
          const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
          publicVideoUrl = `${protocol}://${host}/api/temp-videos/${id}.mp4`;
        }
      }

      console.log(`Hosted video for Meta Reel at: ${publicVideoUrl}`);

      // 2. Register REELS container on Meta
      const createContainerUrl = `https://graph.facebook.com/v20.0/${INSTAGRAM_ID}/media`;
      const containerResponse = await fetch(createContainerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: publicVideoUrl,
          caption: caption || "",
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      });

      if (!containerResponse.ok) {
        const errorText = await containerResponse.text();
        console.error("Reel Container creation failed", errorText);
        return res.status(500).json({ error: `Meta Reels container creation failed: ${errorText}` });
      }

      const { id: creationId } = await containerResponse.json();
      console.log(`Meta Reels video container created with ID: ${creationId}`);

      // 3. Polling status loop to wait for Reels video rendering to complete
      let isReady = false;
      let statusCheckUrl = `https://graph.facebook.com/v20.0/${creationId}?fields=status_code,error_message&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
      
      // We will perform up to 25 retries (about 75-100 seconds total)
      for (let attempt = 1; attempt <= 25; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        try {
          const statusRes = await fetch(statusCheckUrl);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            console.log(`Reel container status check (Attempt ${attempt}/25): ${statusData.status_code}`);
            
            if (statusData.status_code === 'READY') {
              isReady = true;
              break;
            } else if (statusData.status_code === 'ERROR') {
              throw new Error(statusData.error_message || "Meta video processing error.");
            }
          }
        } catch (pollErr: any) {
          console.warn(`Polling attempt ${attempt} warning:`, pollErr.message);
        }
      }

      if (!isReady) {
        console.warn("Reels processing timed out, attempting publication anyway as a fallback...");
      }

      // 4. Publish Reels container
      const publishUrl = `https://graph.facebook.com/v20.0/${INSTAGRAM_ID}/media_publish`;
      const publishResponse = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      });

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        console.error("Meta Reels publish failed", errorText);
        return res.status(500).json({ error: `Meta Instagram Reels publish failed: ${errorText}` });
      }

      const { id: mediaId } = await publishResponse.json();
      console.log(`Instagram Reels publication completed! Media ID: ${mediaId}`);

      // 5. Retrieve post permalink for elegant UX
      let permalink = `https://www.instagram.com/`;
      try {
        const getPostUrl = `https://graph.facebook.com/v20.0/${mediaId}?fields=permalink&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
        const postInfoRes = await fetch(getPostUrl);
        if (postInfoRes.ok) {
          const postData = await postInfoRes.json();
          permalink = postData.permalink || permalink;
        }
      } catch (err) {
        console.warn("Could not fetch permalink for newly created Reel", err);
      }

      // 6. Instantly garbage collect video cache
      tempVideoCache.delete(id);

      return res.json({
        success: true,
        mediaId,
        permalink,
        message: "تم نشر فيديو الريلز بنجاح على حساب منبر أرسنال!"
      });

    } catch (error: any) {
      console.error("Failed to post Reel to Instagram", error);
      return res.status(500).json({ error: error.message || "An error occurred while publishing Reel to Instagram" });
    }
  });

  // Setup Vite Dev server middleware or static bundler for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULLSTACK] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
