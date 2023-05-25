import protobuf from "protobufjs";

const serializeMessage = (message) => {
    try{
        const root = protobuf.loadSync('message/packet.proto');
        const messageSchema = root.lookupType('Packet');

        const payload = messageSchema.create(message);
        const serializedMessage = messageSchema.encode(payload).finish();

        return serializedMessage;
    } catch (err){
        console.error(err);
    }
}

export default serializeMessage;