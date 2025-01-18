import http from "http";
import express from "express";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(cors());

const userSocket = new Map(); // Stores userId -> socketId mapping

// Listen for new connections
io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  // Handle user joining a room
  socket.on("user_join", (data) => {
  
      userSocket.set(data.userId, socket.id); // Map userId to socketId
      console.log(`${data.userId} joined with socket ID: ${socket.id}`);

  });

  // Handle location data from client
  socket.on("send-location", (locationData) => {
    console.log(`Location received from user ${locationData.userId}:`, locationData);
    socket.emit("location-ack", {
      message: "Location received successfully",
      location: locationData,
    });
  });

  // Disconnect event
  socket.on("disconnect", () => {
    for (let [userId, socketId] of userSocket.entries()) {
      if (socketId === socket.id) {
        userSocket.delete(userId); // Remove the userId -> socketId mapping
        console.log(`${userId} disconnected`);
        break;
      }
    }
  });
});

// Use JSON middleware for API requests
app.use(express.json());

// API route for logout
app.get("/api/logout", (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const socketId = userSocket.get(userId);

  if (socketId) {
    io.to(socketId).emit("session-expired", "Your session has expired");
    console.log(`Logout successful for user: ${userId}, socket ID: ${socketId}`);
    return res.status(200).json({ message: "Logout successful" });
  } else {
    console.log(`No active session found for user: ${userId}`);
    return res.status(404).json({ message: "No user active session found" });
  }
});

// Start the server on port 4000
server.listen(4000, () => {
  console.log("Server is running on port 4000");
});
