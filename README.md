# Distributed Monitor with mutual exclusion access

This documentation provides an overview of a Node.js project that implements a distributed monitor using the 
Riccart-Agrawala algorithm. The project utilizes ZeroMQ (here Publish-Subscribe model) for communication and Protocol 
Buffers for data 
serialization. The goal of the project is to provide mutual exclusion for accessing shared data among multiple processes.

## Introduction:

The distributed monitor project implements a mutual exclusion mechanism based on the Riccart-Agrawala algorithm. The algorithm ensures that only one process can access the shared data (represented by a buffer) at a time, preventing conflicts and maintaining data consistency. The project utilizes ZeroMQ, a lightweight messaging library, for communication between the processes, and Protocol Buffers for efficient serialization of data.

## Architecture:

The project consists of two main classes:

1. **Buffer Class**: The Buffer class represents a client with data access. It provides methods for accessing and modifying the shared data, which is internally stored as an array of numbers. The Buffer class also has the capability to read from and write to a file, facilitating persistence of the shared data.

2. **Monitor Class**: The Monitor class implements the mutual exclusion mechanism using the Riccart-Agrawala algorithm. It provides synchronization and coordination among the processes that access the shared data. The Monitor ensures that only one process can enter the critical section and modify the data at a time, while other processes wait for their turn.

## Algorithms and Techniques

### Riccart-Agrawala Algorithm:

The project utilizes the Riccart-Agrawala algorithm to achieve mutual exclusion among the processes. The algorithm 
employs Lamport's logical clock and a request queue to maintain order and prioritize access to the critical section. 
Processes send requests to enter the critical section and only proceed if they have the highest priority among the pending requests. The algorithm ensures fairness and prevents starvation.

### ZeroMQ Communication:

ZeroMQ is used for inter-process communication in the project. The Publish-Subscribe model is adopted, where the processes act as both publishers and subscribers. The Buffer class acts as the publisher, broadcasting updates to the shared data to all subscribers. The Monitor class acts as a subscriber, receiving the updates and coordinating access to the critical section accordingly.

### Serialization:

Protocol Buffers is employed for data serialization in the project. It provides a compact and efficient way to serialize and deserialize data structures. The shared data and request messages exchanged between processes are serialized using Protocol Buffers, allowing for efficient transmission and easy decoding of messages.

## Setup:

To setup the project:

1. Clone the project repository from GitHub.
2. Install the required dependencies by running `npm install`.
3. Run the Node.js script representing the processes, specifying the appropriate configuration, and pass as argument 
   number of process e.g: `node Monitor.js <PROCESS_ID>`
4. The processes will establish communication using ZeroMQ's Publish-Subscribe model.
5. The Buffer class will handle data access and modification, while the Monitor class will provide mutual exclusion 
   using the Riccart-Agrawala algorithm. Monitor will work as middleware layer.

Ensure that the necessary software dependencies, such as Node.js, ZeroMQ, and Protocol Buffers, are installed and configured on the deployment environment.

## Conclusion

The distributed monitor project implements a mutual exclusion mechanism using the Riccart-Agrawala algorithm. It provides synchronized access to shared data among multiple processes, ensuring data consistency and preventing conflicts. The project leverages ZeroMQ for communication and Protocol Buffers for efficient data serialization. By following the provided deployment instructions, the project can be utilized in distributed systems requiring synchronized access to shared resources.

Please refer to the project's GitHub repository for detailed code implementation and further documentation.

**Note:** The project is intended for educational purposes and may require additional enhancements, such as error handling and fault tolerance, for production use in real-world scenarios.

---

