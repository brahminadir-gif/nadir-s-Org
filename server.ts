import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";

// Initialize Firebase Admin (requires service account key)
// In a real app, you'd use process.env.FIREBASE_SERVICE_ACCOUNT_KEY
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to send notifications
  app.post("/api/send-notification", async (req, res) => {
    const { userId, title, body } = req.body;

    if (!admin.apps.length) {
      return res.status(500).json({ error: "Firebase Admin not initialized" });
    }

    try {
      // Get user tokens from Firestore
      const userDoc = await admin.firestore().collection("users").doc(userId).get();
      const tokens = userDoc.data()?.fcmTokens || [];

      if (tokens.length > 0) {
        const message = {
          notification: { title, body },
          tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        return res.json({ success: true, response });
      }

      res.json({ success: true, message: "No tokens found for user" });
    } catch (error) {
      console.error("Error sending FCM message:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
