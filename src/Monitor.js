import zmq from 'zeromq';
import deserialize from "./utils/deserialize.js";
import {Buffer} from "./Buffer.js";
import serializeMessage from "./utils/serializer.js";



class Monitor {
    constructor(){
        this.client = new Buffer();

        this.NUM_OF_PROCESSES = 3;
        this.PROCESS_ID = process.argv[2];
        this.PORT = 3000 + parseInt(this.PROCESS_ID);
        this.publisher = null;

        // concurrent access
        this.processQueue = [];
        this.ackCounter = 0;
        this.usingResource = false;
        this.requestingResource = false;
        console.log("Monitor ID: ", this.PROCESS_ID);
    }

    start(){
        for(let processToObserve = 1; processToObserve<= this.NUM_OF_PROCESSES; processToObserve++){
            if(processToObserve !== parseInt(this.PROCESS_ID))
                this.runSubscriber(processToObserve);
        }
    }

    async runSubscriber(processNum){
        const socket = new zmq.Subscriber;

        await socket.connect(`tcp://127.0.0.1:300${processNum}`);
        socket.subscribe(this.PROCESS_ID.toString());
        console.log(`Subscriber connected to port 300${processNum}`);

        for await(const [topic, message] of socket){
            const parsedMessage = deserialize(message);

            switch (parsedMessage.type) {
                case "Request":{
                    if(!this.usingResource || !this.requestingResource){
                        const ownRequestInQueue = this.processQueue.find((process) =>{
                            return process.PROCESS_ID === this.PROCESS_ID && process.payload.clock < parsedMessage.payload.clock;
                        });
                        if(!ownRequestInQueue ){
                            await this.sendAck(parsedMessage.PROCESS_ID);
                        }
                    }else{
                        this.processQueue.push({PROCESS_ID: parsedMessage.PROCESS_ID, clock: parsedMessage.payload.clock});
                    }
                    break;
                }
                case "ACK":{
                    this.ackCounter++;
                    if(this.ackCounter === this.NUM_OF_PROCESSES - 1){
                        await this.enterCriticalSection('GET');
                    }
                }
            }
        }
    }

    async runPublisher(){
        this.publisher = new zmq.Publisher;
        await this.publisher.bind(`tcp://127.0.0.1:${this.PORT}`);
        console.log(`Publisher bound to port ${this.PORT}`);
    }

    async sendRequest(){
        let processToSend = 1;
        while(processToSend <= this.NUM_OF_PROCESSES){
            if(processToSend !== parseInt(this.PROCESS_ID)){
                const requestMsg = {
                    PROCESS_ID: this.PROCESS_ID,
                    type: "Request",
                    payload: {
                        clock: new Date().getTime(),
                    }
                }
                const buffer = serializeMessage(requestMsg);
                console.log(`Sending multipart message envelope`, processToSend);
                this.processQueue.push({PROCESS_ID: processToSend, clock: requestMsg.payload.clock});
                await this.publisher.send([processToSend.toString(),buffer]);
            }
            processToSend++;
        }
    }

    async sendAck(processId){
        const ackMsg = {
            PROCESS_ID: this.PROCESS_ID,
            type: "ACK",
            payload: {}
        }
        const buffer = serializeMessage(ackMsg);
        console.log("Sending ACK");
        await this.publisher.send([processId.toString(),buffer]);
    }

    async enterCriticalSection(action){
        switch (action) {
            case 'GET':{
                this.usingResource = true;
                const randomPosition = Math.floor(Math.random() * this.client.buffer.length);
                console.log(`Entered critical section at ${this.trackTime()}`);
                console.log(`Got data from buffer at position: ${randomPosition}. It is: ${this.client.getBuffer(randomPosition)}`);
                await this.releaseSection();
            }
        }
    }

    async releaseSection(){
        this.usingResource = false;
        this.requestingResource = false;
        this.ackCounter = 0;
        console.log(`Release critical section at ${this.trackTime()}`);

        while(this.processQueue.length > 0){
            const processToSend = this.processQueue.shift();
            await this.sendAck(processToSend.PROCESS_ID);
        }
    }

    trackTime(){
        const date = new Date();
        const hour = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
        return `${hour}:${minutes}:${seconds}.${milliseconds}`;
    }

}

const m1 = new Monitor();
await m1.runPublisher();
m1.start();
setTimeout(async () => {
    await m1.sendRequest();
},3000);

