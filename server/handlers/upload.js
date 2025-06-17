
const { Blob } = require("node:buffer");
const fs = require("node:fs");


let videos = [];


function upload(req, res) {
    const buffer = req.body;
    const headers = req.headers;

    console.log(headers);


    const videoId = headers["h-video-id"];
    const chunkInd = headers["h-chunk-ind"];
    const chunksNumber = headers["h-chunk-number"];

    let video = videos.find(video => video.id == videoId);

    if (video) 
    {
        video.chunks[chunkInd] = buffer;

        console.log(video);
        
    } else {
        const newVideo = {
            "id": videoId,
            "chunks": new Array(parseInt(chunksNumber)).fill(0),
        };
        
        videos.push(newVideo);
        
        newVideo.chunks[chunkInd] = buffer;
        
        console.log(newVideo);
    }

    res.status(201).json({ "status": "ok" });

}



async function writeToDisk(video) {
    try {
        const videoBuffer = Buffer.concat(video.chunks);

        const filePath = path.join(__dirname, 'uploads', `${video.id}.mp4`);

        await fs.mkdir(path.dirname(filePath), { recursive: true });

        await fs.writeFile(filePath, videoBuffer);

        console.log(`✅ Video ${video.id} saved to ${filePath}`);
    } catch (err) {
        console.error(`Error writing video ${video.id} to disk:`, err);
    }
}



module.exports = { upload };