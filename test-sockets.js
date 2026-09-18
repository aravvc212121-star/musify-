const { io } = require("socket.io-client");

const host = io("http://localhost:3001");
const guest = io("http://localhost:3001");

host.on("connect", () => {
  console.log("Host connected");
  
  host.emit("create-room", (res) => {
    console.log("Room created:", res);
    
    host.emit("join-room", res.roomId, (joinRes) => {
      console.log("Host joined:", joinRes.success);
      
      guest.emit("join-room", res.roomId, (guestRes) => {
        console.log("Guest joined:", guestRes.success);
        
        host.emit("leave-room", res.roomId);
      });
    });
  });
});

guest.on("room-destroyed", (data) => {
  console.log("Guest received room-destroyed:", data);
  process.exit(0);
});

setTimeout(() => {
  console.log("Timeout");
  process.exit(1);
}, 3000);
