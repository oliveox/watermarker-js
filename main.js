const fs = require('fs').promises
const { getImageRatio, getAllRelevantFiles, getFileOrientation, addWatermark } = require('./utils')

async function main () {
	try {
		const args = parseArgs()
		if (!args) throw 'Arguments could not be parsed'

		const dirPath = args.input_directory
		const watermarkPath = args.watermark
		const prefix = args.prefix
		const outputDirPath = args.output_directory

		if (!pathExists(dirPath)) { throw `Input media files directory path [${dirPath}] doesn't exist` }

		if (!pathExists(watermarkPath)) { throw `Watermark file path [${watermarkPath}}] doesn't exist` }

		if (!prefix || prefix.length === 0) { throw 'Prefix empty or not specified' }

		if (outputDirPath && !(await pathExists(outputDirPath))) {
			try {
				await fs.mkdir(outputDirPath, { recursive: true })
			} catch (err) {
				throw `Error while trying to created output directory path [${outputDirPath}]: ${err}`
			}
		}

		const watermarkImageRatio = await getImageRatio(watermarkPath)

		// get image and video files
		console.log(`Scanning [${dirPath}] for relevant files`)
		const filePaths = await getAllRelevantFiles(dirPath)
		console.log('Successfully scanned directory')

		console.log('Adding watermark ... ')
		for (const filePath of filePaths) {
			try {
				const fileOrientation = await getFileOrientation(filePath)

				await addWatermark({
					filePath,
					watermarkPath,
					fileOrientation,
					prefix,
					outputDirPath,
					watermarkImageRatio
				})

				console.log(`Watermarked [${filePath}]`)
			} catch (e) {
				console.error(`Could not watermark file [${filePath}]. Skipping ... \n Error: ${e}`)
			}
		}
		console.log('Watermarking finished')
	} catch (e) {
		console.error(e)
	}
}

function parseArgs () {
	const { ArgumentParser } = require('argparse')
	const { version } = require('./package.json')

	const parser = new ArgumentParser({
		description: 'Add a watermark to a batch of images and videos.'
	})

	parser.add_argument('-v', '--version', { action: 'version', version })
	parser.add_argument('-i', '--input_directory', { help: 'Input media files directory path | [Required]' })
	parser.add_argument('-w', '--watermark', { help: 'Watermark file path | [Required]' })
	parser.add_argument('-p', '--prefix', {
		help: 'Prefix of the new file. OutputFilename = {prefix}{InputFilename} | [Required]'
	})
	parser.add_argument('-o', '--output_directory', {
		help: "Output watermarked files drectory. If path doesn't exist, it will be created | [Optional]"
	})

	return parser.parse_args()
}

async function pathExists (path) { return (!!(await fs.stat(path).catch(e => false))) };

(async () => {
	await main()
})()
