const express = require("express");
const UPLOAD = require("./handlers/upload");
const cors = require("cors");
require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(cors());

app.get("/health", function(req, res) {
    res.status(200).send("ok");
})

app.post("/upload", express.raw({ type: "*/*", limit: "10mb" }), UPLOAD.upload);

app.listen(PORT, () => {
    console.log(`SERVER::LISTENING::${PORT}::PORT`);
})

