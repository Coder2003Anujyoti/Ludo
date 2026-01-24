import { useEffect, useState,useRef} from "react";
import { FaPaperPlane } from "react-icons/fa";
import { io } from "socket.io-client";
const socket = io("https://ludo-18tl.onrender.com");
function Ludo() {
  const [message, setMessage] = useState("");
  const [loading,setLoading]=useState("")
  const [data,setData]=useState(null)
  const [rollingfirst,setRollingfirst]=useState(false)
 const [rollingsecond,setRollingsecond]=useState(false)
 const [lock,setLock]=useState(false)
 const [name,setName]=useState("")
 const [choice,setChoice]=useState("")
 const [firstval,setFirstval]=useState(1)
 const [secondval,setSecondval]=useState(1)
 const inactivityTimeout = useRef(null);
const countdownInterval = useRef(null);
const [timer, setTimer] = useState(20);
const [rolllock,setRolllock]=useState(false)
const opponentIntervalRef = useRef(null);
const triggerInactivity = () => {
    setLoading('Connection issues...');
    socket.disconnect()
  };
  const resetInactivityTimer = () => {
  if (data?.game?.result !== "") return;
  if (inactivityTimeout.current) {
  clearTimeout(inactivityTimeout.current);
  }
  if (countdownInterval.current) {
  clearInterval(countdownInterval.current);
}
  inactivityTimeout.current = setTimeout(triggerInactivity,20000);
  setTimer(20);
  countdownInterval.current = setInterval(() => {
    setTimer(prev => {
      if (prev <= 1) {
        clearInterval(countdownInterval.current);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
const rolldice = (name) => {
  if (name === data.players[0].name) {
    if (rollingfirst) return;
    setRolllock(true)
    setRollingfirst(true);
    let finalUserValue = 1; // store last rolling value
    const userInterval = setInterval(() => {
      const k = Math.floor(Math.random() * 6) + 1;
      finalUserValue = k; // update last value
      setFirstval(k);
    }, 100);

    setTimeout(() => {
      clearInterval(userInterval);

      // use the last value from rolling
      socket.emit("round-done", { name, move: finalUserValue });
      setFirstval(finalUserValue);
    }, 1000);

  } else {
    if (rollingsecond) return;

    setRollingsecond(true);
    setRolllock(true)
    let finalUserValue = 1; // store last rolling value
    const userInterval = setInterval(() => {
      const k = Math.floor(Math.random() * 6) + 1;
      finalUserValue = k; // update last value
      setSecondval(k);
    }, 100);

    setTimeout(() => {
      clearInterval(userInterval);

      // use the last value from rolling
      socket.emit("round-done", { name, move: finalUserValue });
      setSecondval(finalUserValue);
    }, 1000);
  }
};
const submit=()=>{
  if(message.trim().length != 0){
  socket.emit("join-room",{name:message})
  setName(message)
  setLock(!lock)
  }
}
useEffect(()=>{
  socket.on("wait",(msg)=>{
    setLoading(msg)
  })
socket.on("start-game",(msg)=>{
  setData(msg)
  setLoading("")
})
socket.on("choice-turn",(msg)=>{
if(msg=="Your Turn"){
setChoice(msg)
resetInactivityTimer()
}
else{
setChoice(msg)
clearInterval(countdownInterval.current);
 clearTimeout(inactivityTimeout.current);
 setTimer(0)
}
})
socket.on("show-roll", (msg) => {
  clearInterval(opponentIntervalRef.current);
  if (msg.name === msg.players[0].name) {
    setRollingfirst(true);
    opponentIntervalRef.current = setInterval(() => {
      setFirstval(Math.floor(Math.random() * 6) + 1);
    }, 100);

  } else {
    setRollingsecond(true);
    opponentIntervalRef.current = setInterval(() => {
      setSecondval(Math.floor(Math.random() * 6) + 1);
    }, 100);
  }
});

socket.on("result-round",(msg)=>{
if(msg.game.result!=''){
  clearInterval(countdownInterval.current);
    clearTimeout(inactivityTimeout.current);
  }
setFirstval(msg.players[0].move || 1)
setSecondval(msg.players[1].move || 1)
setRollingfirst(false)
setRollingsecond(false)
setRolllock(false)
setData(msg)
})
return () => {
    socket.off('wait')
    socket.disconnect()// Clean up
    clearInterval(countdownInterval.current);
    clearTimeout(inactivityTimeout.current);
  };
},[])
useEffect(() => {
  if (data?.game?.result === "" && choice === "Your Turn") {
    resetInactivityTimer();
  }
}, [choice]);
useEffect(() => {
  if (!socket.connected) {
    socket.connect();
  }
document.body.classList.add("bg-gray-900");
}, []);
  return (
 <>
 { loading== "" && data == null && <>
 <div className="flex flex-col justify-center items-center gap-4 my-48">
  <img src="./images/image.webp" className="w-32 h-32" />
  <div className="relative w-72">
    <input
      type="text" value={message}  onChange={(e)=>setMessage(e.target.value.replace(/\s/g, ""))} 
      placeholder="Type your Name..."
      className="w-full font-bold md:font-semibold px-4 py-2 pr-10 text-black rounded-lg shadow-md focus:outline-none"
    />
    <button className="bg-blue-600" onClick={submit} disabled={lock}>
    <FaPaperPlane  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 text-xl"  />
    </button>
</div>
</div>
 </>
 }
 {loading!="" &&<>
 <div className="my-44 w-full flex flex-col justify-center items-center">
 <p className="font-bold text-center text-white">{loading}</p>
 {loading != "Waiting for another player..."
   &&  <button onClick={()=>{ window.location.reload()}} className="px-4 my-6 font-bold py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        Restart
      </button>
 }
 </div>
 </>}
 { choice=="Your Turn" && data.game.result=='' && loading=="" && rolllock == false &&
  <h2 className="text-center font-bold text-white my-2">
  You have {timer} seconds to choose!
</h2>}
 { data && loading=="" && <>
 <div className="w-full my-3 justify-center
 flex items-center flex-col">
<div className="grid grid-rows-8 gap-px w-80 h-80 bg-white">
{Array.from({ length: 8 }).map((_, row) => (
<div key={row} className="grid grid-cols-8">
{Array.from({ length: 8 }).map((_, col) => {
const index = row * 8 + col;
const hasImage = data.game.positions.includes(index);
const playerindex=data.players[0].position
const computerindex=data.players[1].position
return (
<div key={col} className="relative bg-gray-900 flex justify-start border border-gray-300 overflow-x-scroll text-center">
  { !hasImage && playerindex!=index && computerindex!=index && <>
<h1 className="absolute inset-0 flex items-center justify-center text-center font-bold text-slate-300 text-sm">{index+1}</h1></>
}
{hasImage && (
 <img src="Pigs/Pig.webp" alt="random"
 className="w-10 h-9.5"/>)}
{ playerindex===index && 
<img src={data.players[0].image} alt="random"
className="w-10 h-9.5" />
}
{ computerindex===index && 
 <img src={data.players[1].image} alt="random"
className="w-10 h-9.5" />
}
</div> );})}
</div> ))}
</div>
{ data && (data.players[0].position===63 || data.players[1].position===63 ) &&
 <>
<h1 className="my-4 text-center font-bold text-xl text-white">{data.game.result} is Winner</h1>
<div className="w-full flex justify-center items-center">
<img src={data.players.find((i)=>i.name == data.game.result).image} className="w-24 rounded-md h-24 transition duration-300 ease-in-out transform hover:scale-105" />
</div>
<div className="w-full mt-10 flex justify-center items-center gap-8">   
<button onClick={()=>{ window.location.reload()}} className="px-4 font-bold py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        Restart
      </button>
      </div>
    </>
    }
{ data && data.players[0].position!=63 && data.players[1].position!=63 && <>
<div className="flex gap-8 w-full justify-center items-center text-white my-2">
<div className="flex flex-col items-center">
<span className="text-lg font-bold mb-2">{data.players[0].name}</span>
<div className="w-full flex items-center justify-center">
<img src={data.players[0].image} className="w-12 h-12 rounded-md transition duration-300 ease-in-out transform hover:scale-105" />
</div>
<div className={`w-24 h-24 my-3 bg-white text-black text-4xl font-bold flex items-center justify-center rounded-lg shadow-md transition-transform duration-300 ${rollingfirst ? 'animate-spin' : ''}`}>
{rollingfirst == true ? firstval : (data.players[0].move == 0) ? 1 : data.players[0].move}
</div>
</div>
<div className="flex flex-col items-center">
<span className="text-lg font-bold mb-2">{data.players[1].name}</span>
<div className="w-full flex items-center justify-center">
<img src={data.players[1].image} className="w-12 h-12 rounded-md transition duration-300 ease-in-out transform hover:scale-105" />
 </div>
<div className={`w-24 h-24 my-3 bg-white text-black text-4xl font-bold flex items-center justify-center rounded-lg shadow-md transition-transform duration-300 ${rollingsecond ? 'animate-spin' : ''}`}>
{rollingsecond == true ? secondval : (data.players[1].move == 0) ? 1 : data.players[1].move}
</div>
</div>
</div>
{
choice=="Opposition Turn" && <p className="font-bold my-6 text-white">Opposition Turn</p>}
{ choice=="Your Turn" && rolllock == false && <>
<div className="w-full gap-8 my-3 flex flex-row justify-center flex-wrap items-center">
<button onClick={()=>{
socket.emit("start-roll",{name})
clearInterval(countdownInterval.current);
 clearTimeout(inactivityTimeout.current);
rolldice(name)}} className="px-4 font-bold py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={rollingfirst==true ? true : rollingsecond==true ? true : false}>
  Roll Dice
  </button>
  </div></>}
      </>
      }
  </div>
</>
 }

 </>
  );
}

export default Ludo;