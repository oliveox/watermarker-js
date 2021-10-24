const fs = require('fs');
const sharp = require('sharp');

const {getAllRelevantFiles, getFileOrientation, addWatermark} = require('./utils');

const main = async (args) => {

    try {
        if (!args) throw 'Arguments could not be parsed'

        const dirPath = args.directory;
        const watermarkPath = args.watermark;
        const prefix = args.prefix;
        const outputDirPath = args.output_directory;

        if (!fs.existsSync(dirPath)) 
            throw "First argument (input directory path) not valid";

        if (!fs.existsSync(watermarkPath)) 
            throw "Second argument (watermark path) not valid";

        if (!prefix || prefix.length === 0) 
            throw "Third argument (output file prefix) empty";

        if (outputDirPath && !fs.existsSync(outputDirPath)) 
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

const parse_args = () => {
    const { ArgumentParser } = require('argparse');
    const { version } = require('./package.json');
    
    const parser = new ArgumentParser({
        description: 'Add a watermark to a batch of images and videos.'
    });
 
    parser.add_argument('-v', '--version', { action: 'version', version });
    parser.add_argument('-d', '--directory', { help: 'Media files directory path | [Required]' });
    parser.add_argument('-w', '--watermark', { help: 'Watermark file path | [Required]' });
    parser.add_argument('-p', '--prefix', { help: 'Prefix of the new file. OutputFilename = {prefix}{InputFilename} | [Required]' });
    parser.add_argument('-od', '--output_directory', { help: 'Drectory where the output watermarked files will be placed | [Optional]' });
    
    return parser.parse_args();
}

(async () => {
    const args = parse_args();
    await main(args);
})();