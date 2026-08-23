import net from "node:net";

const socket = new net.Socket();

socket.setTimeout(5000);

socket.connect(6379, "172.0.0.1", () => {
    console.log("TCP CONNECTION SUCCESS");
    socket.write("*1\r\n$4\r\nPING\r\n");
});

socket.on("data", (data) => {
    console.log("Redis response:", data.toString());
    socket.destroy();
});

socket.on("timeout", () => {
    console.error("TCP CONNECTION TIMEOUT");
    socket.destroy();
});


socket.on("error", (error) => {
    console.error("TCP ERROR:", error);
});


socket.on("close", () => {
    console.log("Socket closed");
});