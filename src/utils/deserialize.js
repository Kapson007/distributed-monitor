import protobuf from "protobufjs";

const deserialize = (buffer) => {
    try{
        const root = protobuf.loadSync('message/packet.proto');
        const messageSchema = root.lookupType("Packet")

        const payload = messageSchema.decode(buffer);

        console.log("Deserialized Message: ", payload);

        return payload;

    }catch (err){
        console.error(err);
    }
}

export default deserialize;