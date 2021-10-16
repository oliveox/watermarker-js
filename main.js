const fs = require('fs');
const sharp = require('sharp');

const {getAllRelevantFiles, getFileOrientation, addWatermark} = require('./utils');

const main = async () => {

    try {
        const dirPath = process.argv[2];
        const watermarkPath = process.argv[3];
        const prefix = process.argv[4];
        const outputDirPath = process.argv[5];

        if (!fs.existsSync(dirPath)) 
            throw "First argument (input directory path) not valid";

        if (!fs.existsSync(watermarkPath)) 
            throw "Second argument (watermark path) not valid";

        if (!prefix || prefix.length === 0) 
            throw "Third argument (output file prefix) empty";

        if (outputDirPath && !fs.existsSync(dirPath)) 
            throw "Fourth argument (output directory path) is not a valid path";

        // get watermark ratio
        const image = sharp(watermarkPath);
        const metadata = await image.metadata();
        if (!metadata || !metadata.height || !metadata.width)
            throw `Could not fetch watermark metadata at path [${watermarkPath}]. The end ...`
        const watermarkImageRatio = metadata.width / metadata.height;    

        // get image and video files
        console.log(`Fetching all relevant files from [${dirPath}]`);
        const filePaths = await getAllRelevantFiles(dirPath);
        console.log(`Successfully fetched all relevant files from [${dirPath}]`);

        console.log(`Adding watermark to files from [${dirPath}]`);
        for (let filePath of filePaths) {

            try {
                const fileOrientation = await getFileOrientation(filePath);
    
                // TODO - pass object not data
                await addWatermark(filePath, watermarkPath, fileOrientation, prefix, outputDirPath, watermarkImageRatio);
    
                console.log(`Watermarked [${filePath}]`);
            } catch (e) {
                console.error(`Could not watermark file [${filePath}]. Skipping ... \n Error: ${e}`);
            }
           
        }
        console.log(`Watermarking finished`);
        
    } catch (e) {
        console.error(e);
    }
}

(async () => {
    await main();
})();