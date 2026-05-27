import { app } from "./app.js"; 
import connectDB from "./db/index.js"
import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
})

connectDB()
.then(() => {
     app.on("error", (error) => {
            console.log("error on index.js :", error)
        });
    
    app.listen(process.env.PORT || 4000, () => {
        console.log(`server is running on ${process.env.PORT}`)
    })
})
.catch((err) => {
console.log("MongoDb connection is failed !!", err)
});

// const app = express();

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI }/${DB_NAME}`);
//         app.on("error", (error) => {
//             console.log("error :", error)
//         });
//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening in port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.log("ERROR hai bhai : ", error );
//         throw error;
//     }
// })()