const fs = require('fs').promises;
const sharp = require('sharp');

const {getAllRelevantFiles, getFileOrientation, addWatermark} = require('./utils');

const main = async () => {
    try {
        const args = parse_args();
        if (!args) throw 'Arguments could not be parsed'

        const dirPath = args.directory;
        const watermarkPath = args.watermark;
        const prefix = args.prefix;
        const outputDirPath = args.output_directory;

        if (!pathExists(dirPath)) 
            throw "Input media files directory path doesn't exist";

        if (!pathExists(watermarkPath)) 
            throw "Watermark file path doesn't exist";

        if (!prefix || prefix.length === 0) 
            throw "Prefix not specified";

        if (outputDirPath && !(await pathExists(outputDirPath))) {
            try {
                await fs.mkdir(outputDirPath, {recursive: true})
            } catch (err) {
                throw `Error while trying to created output directory path: ${err}`
            }
        }

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
    parser.add_argument('-d', '--directory', { help: 'Input media files directory path | [Required]' });
    parser.add_argument('-w', '--watermark', { help: 'Watermark file path | [Required]' });
    parser.add_argument('-p', '--prefix', { help: 'Prefix of the new file. OutputFilename = {prefix}{InputFilename} | [Required]' });
    parser.add_argument('-od', '--output_directory', { help: "Output watermarked files drectory. If path doesn't exist, it will be created | [Optional]" });
    
    return parser.parse_args();
}

const pathExists = async path => !!(await fs.stat(path).catch(e => false));

(async () => {
    await main();
})();