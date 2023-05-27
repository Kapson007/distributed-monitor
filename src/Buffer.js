import {v4 as uuidv4} from 'uuid';

export class Buffer {
    constructor() {
        this.buffer = [1,2,3,4,5,6,7,8];
    }

    getBuffer(position) {
        if(position < this.buffer.length) {
            console.log(`Getting value: ${this.buffer[position]}`);
            return this.buffer[position];
        }
    }

    setBufferValue(position, value) {
        if(typeof position !== 'number' || typeof value !== 'number') throw new Error('Invalid type');

        if(position < this.buffer.length) {
            console.log(`Setting value: ${value} at position: ${position}`);
            this.buffer.splice(position, 1, value);
        }
    }

    displayBuffer() {
        console.log(`Buffer: ${this.buffer}`);
    }
}

