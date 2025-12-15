console.log("loading the event processor");

const init=()=>{
    console.log("initializing the event processor");
}

const onEvent=(e)=>{
    console.log(e.event)
    e.event="ABC";
    console.log(e.event)
}