import zmq from 'zeromq';
import deserialize from "./utils/deserialize.js";
import {Buffer} from "./Buffer.js";
import serializeMessage from "./utils/serializer.js";

class Monitor {
    constructor(){
        // client data
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
        this.lamportClock = 0;
        console.log("Monitor ID: ", this.PROCESS_ID);
    }

    start(){
        let processToObserve = 1;
        do{
            if(processToObserve !== parseInt(this.PROCESS_ID)){
                this.runSubscriber(processToObserve);
            }
            processToObserve++;
        }while(processToObserve <= this.NUM_OF_PROCESSES);
    }

    async runSubscriber(processNum){
        const socket = new zmq.Subscriber;

        await socket.connect(`tcp://127.0.0.1:300${processNum}`);
        socket.subscribe(this.PROCESS_ID.toString());
        console.log(`Subscriber connected to port 300${processNum}`);

        for await(const [topic, message] of socket){
            console.log("Received a message related to:");
            const parsedMessage = deserialize(message);

            switch (parsedMessage.type) {
                case "Request":{
                    // update lamport clock after receive event
                    this.updateLamportClock(parsedMessage.payload.clock);

                    const ownRequestInQueue = this.processQueue.find((process) =>{
                        return process.PROCESS_ID === this.PROCESS_ID && process.payload.clock < parsedMessage.payload.clock;
                    });

                    if(this.usingResource || this.requestingResource || ownRequestInQueue) {
                        console.log(`using resource: ${this.usingResource} `, `requesting resource: ${this.requestingResource} `, `own request in queue: ${ownRequestInQueue}`);
                        console.log(`Received request is not the first in queue, adding to queue`);
                        this.processQueue.push({
                            PROCESS_ID: parsedMessage.PROCESS_ID,
                            clock: parsedMessage.payload.clock
                        });
                        console.log("request queue: ",this.processQueue);
                    }else{
                        await this.sendAck(parsedMessage.PROCESS_ID);
                    }
                    break;
                }
                case "ACK":{
                    // update number of acknowledge messages received
                    this.ackCounter++;
                    if(this.ackCounter === this.NUM_OF_PROCESSES - 1){
                        await this.enterCriticalSection('GET');
                    }
                    break;
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
        // synchronize lamport clock
        this.requestingResource = true;
        ++this.lamportClock;

        let processToSend = 1;

        const requestMsg = {
            PROCESS_ID: this.PROCESS_ID,
            type: "Request",
            payload: {
                clock: this.lamportClock,
            }
        }

        this.processQueue.push({PROCESS_ID: processToSend, clock: requestMsg.payload.clock});
        this.displayRequestQueue();

        while(processToSend <= this.NUM_OF_PROCESSES){
            if(processToSend !== parseInt(this.PROCESS_ID)){

                console.log(`Lamport clock after send event: ${this.lamportClock}`);

                const buffer = serializeMessage(requestMsg);
                console.log(`Sending request message to process ${processToSend}`);
                await this.publisher.send([processToSend,buffer]);
            }
            ++processToSend;
        }
        this.processQueue.shift();
    }

    async sendAck(processId){
        const ackMsg = {
            PROCESS_ID: this.PROCESS_ID,
            type: "ACK",
            payload: {}
        }
        const buffer = serializeMessage(ackMsg);
        console.log("Sending ACK");
        await this.publisher.send([processId,buffer]);
    }

    async enterCriticalSection(action){
        this.usingResource = true;
        switch (action) {
            case 'GET':{
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

        this.displayRequestQueue();
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

    updateLamportClock(receivedClock){
        this.lamportClock = Math.max(this.lamportClock, receivedClock) + 1;
        this.displayCurrentLamportClock();
    }

    displayCurrentLamportClock(){
        console.log(`Current Lamport's clock Process${this.PROCESS_ID} is: ${this.lamportClock}`);
    }

    displayRequestQueue(){
        console.log("Request queue: ", this.processQueue);
    }
}

(async () => {
    const m1 = new Monitor();
    await m1.runPublisher();
    m1.start();
    if(process.argv[2] && process.argv[2] !== '1'){
        setTimeout(async () => {
            await m1.sendRequest();
            // 3000 * parseInt(process.argv[2])
        }, 3000 * parseInt(process.argv[2]));
    }
})();

