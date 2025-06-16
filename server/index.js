const express = require("express");
const UPLOAD = require("./handlers/upload");
require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.get("/health", function(req, res) {
    res.status(200).send("ok");
})
app.post("/upload", UPLOAD.upload);

app.listen(PORT, () => {
    console.log(`SERVER::LISTENING::${PORT}::PORT`);
})

