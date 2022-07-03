import React, { useEffect, useState } from 'react'; //  useCallback

const App = () => {
    const [messageContent, setMessageContent] = useState("");
    const [chats, setChats] = useState([]);
    const [rosters, setRosters] = useState([]);

    const [hostName, setHostName] = useState("websocket.londonpark.workers.dev");
    const [roomName, setRoomName] = useState("test");
    const [userName, setUserName] = useState("Anonymous");
    const [isRejoined, setIsRejoined] = useState(false);
    const [lastSeenTimestamp, setLastSeenTimestamp] = useState(0);
    const [wroteWelcomeMessage, setWroteWelcomeMessage] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [currentWebSocket, setCurrentWebSocket] = useState(null);

    const join = () => {

        const ws = new WebSocket(`wss://${hostName}/api/room/${roomName}/websocket`);
        
        const startTime = Date.now();
      
        const rejoin = async () => {

          // const roster = document.querySelector("#roster");

          if (!isRejoined) {
            setIsRejoined(true);
            setCurrentWebSocket(null);
      
            // Don't try to reconnect too rapidly
            let timeSinceLastJoin = Date.now() - startTime;
            if (timeSinceLastJoin < 10000) {
              // Less than 10 seconds elapsed since last join. Pause a bit
              await new Promise(resolve => setTimeout(resolve, 10000 - timeSinceLastJoin));
            }
      
            // reconnect now!
            join();
          }
        }
      
        ws.onopen = (event) => {
          setCurrentWebSocket(ws);
          ws.send(JSON.stringify({ name: userName }));
        };
      
        ws.onmessage = (event) => {

          const data = JSON.parse(event.data);
    
          if (data?.error) {
            chats.push({ name: null, message: "* Error", timestamp: null });
            setChats([...chats]);
          } 
          else if (data?.joined) {
            rosters.push(data?.joined);
            setRosters([...rosters]);
          } 
          else if (data?.quit) {
            const removedRosters = rosters?.filter((item) => { return item !== data?.quit });
            setRosters([...removedRosters]);
          } 
          else if (data?.ready) {
            // All pre-join messages have been delivered.
            if (!wroteWelcomeMessage) {              
              if (roomName.length !== 64) {
                // chats.push({ name: null, message:  `Welcome to the Room <#${roomName}>`, timestamp: null });
                // setChats([...chats]);
                // setWroteWelcomeMessage(true);
              }
            }
          } 
          else {
            // Add Chat Message
            if (data?.timestamp > lastSeenTimestamp) {
              chats.push({ name: data?.name, message: data?.message, timestamp: data?.timestamp });
              setChats([...chats]);
              setLastSeenTimestamp(data?.timestamp);
            }
          }
        };
      
        ws.onclose = (event) => {
          console.log("WebSocket closed, reconnecting:", event?.code, event?.reason);
          rejoin();
        };
      
        ws.onerror = (event) => {
          console.log("WebSocket error, reconnecting:", event);
          rejoin();
        };
    };

    const startChat = () => {      
        // Normalize the room name a bit.
        // roomname = roomname.replace(/[^a-zA-Z0-9_-]/g, "").replace(/_/g, "-").toLowerCase();

        if (roomName.length > 32 && !roomName.match(/^[0-9a-f]{64}$/)) {
          
          chats.push({ name: "ERROR", message: "Invalid room name", timestamp: null });
          setChats([...chats]);
          // addChatMessage("ERROR", "Invalid room name.");
          return;
        };
      
        join();
    };

    useEffect(() => {
        if (!currentWebSocket) {
            startChat();
        };
    });

    const sendMessageHandler = async (event) => {
        setMessageContent(event.target.value);
    };
    
    const submitSendMessage = async (event) => {
        
        event.preventDefault();
        
        if (messageContent && currentWebSocket) {
            const msg = {
            name: userName,
            message: messageContent,
            timestamp: new Date(),
            };

            currentWebSocket.send(JSON.stringify(msg));
            setMessageContent("");
        }
    };
    
    const enterKeyPress = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submitSendMessage(event);
        }
    };

    return (
      <div>
        {chats.map((chat, idx) => <p key={idx}>{chat.name}: {chat.message}</p>)}
        <div id="roster">
          {rosters ? <p>로그인 유저 목록</p> : null}
          {[...new Set(rosters)].map((roster, idx) => <p key={idx}>{roster}</p>)}
        </div>
        <input 
            id="chat-input" 
            value={messageContent}
            onChange={sendMessageHandler}
            onKeyPress={enterKeyPress}
            placeholder={currentWebSocket ? "Enter your message" : "Connecting to Server..."}
        />
      </div>
    );
  };
  
  export default App;