import { io } from "socket.io-client";
import { getBackendBaseUrl } from "./pvpApi";

export function createMatchSocket() {
  return io(getBackendBaseUrl(), {
    transports: ["websocket", "polling"],
  });
}
