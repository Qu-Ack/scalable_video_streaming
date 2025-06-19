
const fs = require("node:fs/promises");
const path = require("node:path");


let videos = [];



function upload(req, res) {
    const buffer = req.body;
    const headers = req.headers;

    const videoId = headers["h-video-id"];
    const chunkInd = parseInt(headers["h-chunk-ind"]);
    const chunksNumber = parseInt(headers["h-chunk-number"]);
    const fileType = headers["h-file-type"];


    console.log(`chunk received! Chunk index : ${chunkInd}`);

    let video = videos.find(v => v.id === videoId);

    if (!video) {
        video = {
            id: videoId,
            chunks: new Array(chunksNumber).fill(null),
            received: 0,
            type: fileType,
        };
        videos.push(video);
    }

    if (!video.chunks[chunkInd]) {
        video.chunks[chunkInd] = buffer;
        video.received++;
    }

    if (video.received === chunksNumber) {
        console.log(`All chunks received for video ${videoId}`);
        console.log(video);
        writeToDisk(video);
    }

    res.status(201).json({ status: "ok" });
}



async function writeToDisk(video) {
    try {
        const videoBuffer = Buffer.concat(video.chunks);

        let filePath = ""
        switch (video.type) {
            case "image/png":
                filePath = path.join(__dirname, 'uploads', `${video.id}.png`);
                break;
            case "image/jpg":
                filePath = path.join(__dirname, 'uploads', `${video.id}.jpg`);
                break;
            case "image/jpeg":
                filePath = path.join(__dirname, 'uploads', `${video.id}.jpeg`);
                break;
            case "video/mp4":
                filePath = path.join(__dirname, 'uploads', `${video.id}.mp4`);
                break;
            default:
                filePath = path.join(__dirname, 'uploads', `${video.id}.mp4`);
                break;
        }

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, videoBuffer);

        console.log(`Video ${video.id} saved to ${filePath}`);
    } catch (err) {
        console.error(`Error writing video ${video.id} to disk:`, err);
    }
}


module.exports = { upload };