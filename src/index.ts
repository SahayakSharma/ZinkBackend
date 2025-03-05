import express from "express"
import http from 'http';
import { createServer } from "https"
import { Server } from "socket.io"
import cors from "cors"
const app = express();
app.use(cors({origin:"*"}));
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin:"*",
    }
});

const online:Map<string,string>=new Map();
const onCall:Map<string,string>=new Map();

io.on("connection", (socket) => {
    socket.on("CameOnline",(data)=>{
        const email=data.email;
        online.set(email,socket.id);
    })

    socket.on("WentOffline",(data)=>{
        const email=data.email;
        online.delete(email);
        onCall.delete(email);
    })
    socket.on("CallStarted",(data)=>{
        const email=data.email;
        online.delete(email);
        onCall.set(email,socket.id);
    })
    socket.on("CallOver",(data)=>{
        const email=data.email;
        onCall.delete(email);
        online.set(email,socket.id);
    })
    socket.on("MakeCall",data=>{
        const senderEmail=data.senderEmail;
        const receiverEmail=data.receiverEmail;
        const receiverSocketID=online.get(receiverEmail);
        if(receiverSocketID) io.to(receiverSocketID).emit("CallReceived",{senderEmail:senderEmail,receiverEmail:receiverEmail});
    })
    socket.on("CallAnswered",data=>{
        const senderEmail=data.senderEmail;
        const receiverEmail=data.receiverEmail;
        const receiverSocketID=online.get(receiverEmail);
        if(receiverSocketID) io.to(receiverSocketID).emit("CallAnswered",{senderEmail:senderEmail,receiverEmail:receiverEmail});
    })
    socket.on("ListAllUsers",data=>{
        const allusers:string[]=[];
        allusers.push(...online.keys());
        allusers.push(...onCall.keys());
        socket.emit("ListOfAllUsers",{users:allusers})
    })

    socket.on("GetUserStatus",data=>{
        const email=data.email;
        const isonline=online.get(email);
        const isoncall=onCall.get(email);
        if(isoncall) socket.emit("UserStatus",{status:"onCall"});
        else if(isonline) socket.emit("UserStatus",{status:"online"});
        else socket.emit("UserStatus",{status:"offline"})
    })

    socket.on("offerGenerated",data=>{
        const offer=data.offer;
        const senderEmail=data.senderEmail;
        const receiverEmail=data.receiverEmail;
        const audio=data.audio;
        const video=data.video;
        const receiverSocketID=online.get(receiverEmail);
        if(receiverSocketID){
            io.to(receiverSocketID).emit("offerReceived",{offer:offer,senderEmail:senderEmail,receiverEmail:receiverEmail,audio:audio,video:video});
        }
    })
    socket.on("SendIceCandidates",data=>{
        const candidates=data.candidates;
        const senderEmail=data.senderEmail;
        const receiverEmail=data.receiverEmail;
        const receiverSocketID=online.get(receiverEmail);
        if(receiverSocketID) io.to(receiverSocketID).emit("IceCandidates",{candidates:candidates})
    })
    socket.on("answerGenerated",data=>{
        const answer=data.answer;
        const audio=data.audio;
        const video=data.video;
        const senderEmail=data.senderEmail;
        const receiverEmail=data.receiverEmail;
        const receiverSocketID=online.get(receiverEmail);
        if(receiverSocketID){
            io.to(receiverSocketID).emit("answerReceived",{answer:answer,senderEmail:senderEmail,receiverEmail:receiverEmail,audio:audio,video:video});
        }
    })
})
io.on("disconnect",(socket)=>{
    online.delete(socket.id);
})
app.use(cors())
app.get("/", (req, res) => {
    res.send("Hello")
})
server.listen(3000, () => {
    console.log("Server is running")
})

