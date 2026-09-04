import React, { createContext, useContext, useEffect, useState } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let ws = null;
    let timer = null;

    const connectWS = () => {
      try {
        const getWsUrl = () => {
          if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
          if (typeof window !== "undefined") {
            const isSecure = window.location.protocol === "https:";
            const wsProtocol = isSecure ? "wss:" : "ws:";
            const hostname = window.location.hostname;
            if (window.location.port === "3000") {
              return `${wsProtocol}//${hostname}:8000/ws`;
            }
            return `${wsProtocol}//${window.location.host}/ws`;
          }
          return "ws://localhost:8000/ws";
        };
        ws = new WebSocket(getWsUrl());


        ws.onopen = () => {
          setIsConnected(true);
          console.log("WebSocket connected to dispatch platform");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);

            if (data.type && data.type !== "PONG") {
              const newNotification = {
                id: Date.now(),
                type: data.type,
                text: formatNotificationText(data),
                timestamp: new Date().toLocaleTimeString(),
              };
              setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
            }
          } catch (e) {
            console.error("Error parsing websocket message", e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          timer = setTimeout(connectWS, 3000);
        };

        ws.onerror = (err) => {
          ws.close();
        };

        setSocket(ws);
      } catch (e) {
        setIsConnected(false);
        timer = setTimeout(connectWS, 3000);
      }
    };

    connectWS();

    return () => {
      if (timer) clearTimeout(timer);
      if (ws) ws.close();
    };
  }, []);

  const formatNotificationText = (msg) => {
    switch (msg.type) {
      case "EMERGENCY_CREATED":
        return `🚨 New ${msg.priority} Emergency: ${msg.emergency_type} at ${msg.address}`;
      case "EMERGENCY_STATUS_UPDATED":
        return `⚡ Emergency #${msg.emergency_id} status changed to ${msg.new_status}`;
      case "DISPATCH_OVERRIDE_EXECUTED":
        return `🛡️ Dispatcher assigned ${msg.ambulance_callsign} to Emergency #${msg.emergency_id}`;
      case "AMBULANCE_STATUS_CHANGED":
        return `🚑 ${msg.callsign} status changed to ${msg.status}`;
      case "HOSPITAL_CAPACITY_UPDATED":
        return `🏥 ${msg.name} updated ER capacity: ${msg.available_er_beds} beds free (${msg.er_status})`;
      default:
        return `System Event: ${msg.type}`;
    }
  };

  const clearNotifications = () => setNotifications([]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, lastMessage, notifications, clearNotifications }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
