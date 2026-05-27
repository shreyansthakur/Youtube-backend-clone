import mongoose from "mongoose";
import {DB_NAME} from "../constant.js";

 const connectDB = async () =>{
    try {
        const connnectionInstance = await mongoose.connect(`mongodb+srv://shreyansh_thakur99:chhotababy@cluster0.geg1coj.mongodb.net/${DB_NAME}`)
        console.log(`\n MoongoDb connected : ${connnectionInstance.connection.host}`);
            
        
    } catch (error) {
        console.log("Error hai bhai  :", error );
        process.exit(1);
    }
}


export default connectDB;