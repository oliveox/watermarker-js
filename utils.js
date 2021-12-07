const fs = require('fs')
const path = require('path')
const fileType = require('file-type')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const ffprobe = require('ffprobe')
const ffprobeStatic = require('ffprobe-static')
const sharp = require('sharp')

const {
	relevantFileTypes, ORIENTATION, settings,
	watermarkToHeightRatio, watermarkToWidthRatio, exifPortraitCodes
} = require('./config')

async function addWatermark ({
	filePath, watermarkPath, fileOrientation, prefix, outputDirPath, watermarkImageRatio
}) {
	const outputFilename = `${prefix}${path.basename(filePath)}`
	const outputFilePath = outputDirPath
		? path.join(outputDirPath, outputFilename)
		: path.join(path.dirname(filePath), outputFilename)

	let overlay = `[wtrmrk]${getOverlay(settings)}`

	const { ext, mime } = await fileType.fromFile(filePath)
	const transpose = fileOrientation === ORIENTATION.PORTRAIT && mime.split('/')[0] !== 'video'
		? '[0:v]transpose=2 [mediaFile],'
		: ''

	if (transpose.length > 0) {
		overlay = `[mediaFile]${overlay}`
	} else {
		overlay = `[0:v]${overlay}`
	}

	const watermarkScaling = await getWatermarkScaling(filePath, fileOrientation, watermarkImageRatio)

	const command = `ffmpeg -y -i "${filePath}" -i "${watermarkPath}" \
						-filter_complex "${transpose}${watermarkScaling}${overlay}" "${outputFilePath}"`

	try {
		await exec(command)
	} catch (e) {
		console.debug(`FFmpeg error. Command: [${command}]`)
		throw `FFmpeg error for file [${filePath}]: [${e}]`
	}
}

const getWatermarkScaling = async (filePath, orientation, watermarkImageRatio) => {

	// good for both images and videos
	const fileMetadata = await ffprobe(filePath, { path: ffprobeStatic.path })

	if (!fileMetadata || !fileMetadata.streams[0].height || !fileMetadata.streams[0].width)
		throw `Could not get height / width data about [${filePath}]. Skipping ... `

	const imageWidth = fileMetadata.streams[0].width
	const imageHeight = fileMetadata.streams[0].height

	let watermarkWidth
	let watermarkHeight

	switch (orientation) {
	case ORIENTATION.LANDSCAPE:
		watermarkHeight = imageHeight * watermarkToHeightRatio
		watermarkWidth = watermarkImageRatio * watermarkHeight
		break
	case ORIENTATION.PORTRAIT:
		watermarkWidth = imageWidth * watermarkToWidthRatio
		watermarkHeight = watermarkWidth / watermarkImageRatio
		break
	default:
		throw 'Orientation value unknown. Fatal error!'
	}

	return `[1:v] scale=${watermarkWidth}:${watermarkHeight} [wtrmrk];`
}



const getOverlay = (settings) => {
	let overlay = ''

	if (settings.position == null || !['NE', 'NC', 'NW', 'SE', 'SC', 'SW', 'C', 'CE', 'CW'].includes(settings.position))
		throw `invalid_watermark_position: ${settings.position}`

	if (settings.margin_nord == null || isNaN(settings.margin_nord)) settings.margin_nord = 0
	if (settings.margin_south == null || isNaN(settings.margin_south)) settings.margin_south = 0
	if (settings.margin_east == null || isNaN(settings.margin_east)) settings.margin_east = 0
	if (settings.margin_west == null || isNaN(settings.margin_west)) settings.margin_west = 0

	const getHorizontalMargins = (east, west) => {
		return getSing(east, false).toString() + getSing(west, true).toString()
	}

	const getVerticalMargins = (nord, south) => {
		return getSing(nord, false).toString() + getSing(south, true).toString()
	}

	const getSing = (val, inverse) => {
		return (val > 0 ? (inverse ? '-' : '+') : (inverse ? '+' : '-')).toString() + Math.abs(val).toString()
	}

	// Calculate formula
	switch (settings.position) {
	case 'NE':
		overlay = '0' + getHorizontalMargins(settings.margin_east, settings.margin_west) +
					':0' + getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	case 'NC':
		overlay = 'main_w/2-overlay_w/2' + getHorizontalMargins(settings.margin_east, settings.margin_west) +
					':0' + getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	case 'NW':
		overlay = 'main_w-overlay_w' + getHorizontalMargins(settings.margin_east, settings.margin_west) +
					':0' + getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	case 'SE':
		overlay = '0' + getHorizontalMargins(settings.margin_east, settings.margin_west) + ':main_h-overlay_h' +
					getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	case 'SC':
		overlay = 'main_w/2-overlay_w/2' + getHorizontalMargins(settings.margin_east, settings.margin_west) +
					':main_h-overlay_h' + getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	case 'SW':
		overlay = 'main_w-overlay_w' + getHorizontalMargins(settings.margin_east, settings.margin_west) +
					':main_h-overlay_h' + getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	case 'CE':
		overlay = '0' + getHorizontalMargins(settings.margin_east, settings.margin_west) +
					':main_h/2-overlay_h/2' + getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	case 'C':
		overlay = 'main_w/2-overlay_w/2' + getHorizontalMargins(settings.margin_east, settings.margin_west) +
					':main_h/2-overlay_h/2' + getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	case 'CW':
		overlay = 'main_w-overlay_w' + getHorizontalMargins(settings.margin_east, settings.margin_west) +
					':main_h/2-overlay_h/2' + getVerticalMargins(settings.margin_nord, settings.margin_south)
		break
	}

	return `overlay=${overlay}`
}

async function getFileOrientation (filePath) {
	const { _, mime} = await fileType.fromFile(filePath)
	const mediaType = mime.split('/')[0]

	switch (mediaType) {
	case 'image': {
		const image = sharp(filePath)
		const metadata = await image.metadata()

		if (!metadata) throw new Error(`Can't get metadata about [${filePath}]`)

		return metadata.orientation && exifPortraitCodes.includes(metadata.orientation)
			? ORIENTATION.PORTRAIT 
			: ORIENTATION.LANDSCAPE
	}
	case 'video': {
		const data = await ffprobe(filePath, {path: ffprobeStatic.path})

		if (!data) throw `Can't get metadata about [${filePath}]`

		const rotation = data.streams[0].tags.rotate

		if (rotation) {
			return Number.isInteger(rotation / 90) ? ORIENTATION.PORTRAIT : ORIENTATION.LANDSCAPE
		} else if (data.streams[0].height && data.streams[0].width) {
			return data.streams[0].height > data.streams[0].width ? ORIENTATION.PORTRAIT : ORIENTATION.LANDSCAPE
		} else {
			throw `Can't get enough metadata about [${filePath}] in order to get its orientation`
		}
		// empirically speaking, video files without rotation metadata are usually landscape
	}
	default:
		throw 'Irrelevant media type given for analysis'
	}

}

async function getFilesRecursively (dirPath, arrayOfFiles) {
	const files = fs.readdirSync(dirPath)
	arrayOfFiles = arrayOfFiles || []
	for (const file of files) {
		if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
			arrayOfFiles = await getFilesRecursively(path.join(dirPath, file), arrayOfFiles)
		} else {
			const filePath = path.join(dirPath, file)
			if (await fileIsRelevant(filePath)) arrayOfFiles.push(filePath)
		}
	}

	return arrayOfFiles
}

async function getAllRelevantFiles (dirPath, arrayOfFiles) {
	return getFilesRecursively(dirPath, arrayOfFiles)
}

const fileIsRelevant = async (filePath) => {
	try {
		const { ext, mime } = await fileType.fromFile(filePath)
		const isRelevant = mime?.split('/').length === 2 && relevantFileTypes.includes(mime?.split('/')[0])
		return isRelevant
	} catch (e) {
		console.debug(`Can't get media type of file [${filePath}]. Exception: ${e}`)
		return false
	}
}

async function getImageRatio (imagePath) {
	const image = sharp(imagePath)
	const metadata = await image.metadata()
	if (!metadata || !metadata.height || !metadata.width)
		throw `Could not fetch image metadata at path [${imagePath}]`
	const imageRatio = metadata.width / metadata.height

	return imageRatio
}

module.exports = { addWatermark, getFileOrientation, getAllRelevantFiles, getImageRatio }
