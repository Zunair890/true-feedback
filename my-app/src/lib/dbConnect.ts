import mongoose from "mongoose";

type ConnectionObject={
    isConnected?: number;
}

const connection: ConnectionObject={};

async function dbConnect():Promise<void>{
    // check if have the connection with database or not!

    if(connection.isConnected){
        console.log("Already connected to the database!");
        return;
    }
    try {
        // other attempt to connect to DB
        const db= await mongoose.connect(process.env.MONGO_URI || '',{});
        connection.isConnected= db.connections[0].readyState;
        console.log("Database connected sucessfully")
    } catch (error) {
        console.log("DB connection failed!",error);
        process.exit();
    }
}

export default dbConnect;