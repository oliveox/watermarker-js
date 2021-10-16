# WATERMAKER
With a single console command, add a watermark to batches of (supported formats) images and videos.

# How to use it?

## Prerequisites
### You need to have installed and available in your path:
1. FFmpeg ( `ffmpeg` )
2. NodeJs ( `node` )

## Installation
1. clone this project
2. run `npm install` in the root of the project

## Watermarking command
### In the root of the project, run:
`node main.js {media_files_directory_path} {watermark_file_path} ${prefix} {output_directory_path}`

1. media_files_directory_path - mandatory
2. watermark_file_path - mandatory
3. prefix - mandatory: outputFilename = {prefix}{inputFilename}
4. output_directory_path - optional - directory where the output watermarked files will be placed

## Configuration
In the [config.js](https://github.com/oliveox/watermarker/blob/main/config.js) file you can set:


- Position of the watermark in the media file. Margins are express in pixels.
```
  settings: {
            position		: "SW"	// Cardinal Position: NE NC NW SE SC SW C CE CW
            , margin_nord	: null	// Margin nord 
            , margin_south	: 15	// Margin south
            , margin_east	: null	// Margin east
            , margin_west	: 15	// Margin west
        },
```

- (height / width) ratio between the watermark and the media file. 

Height ratio is used for landscape files, width ratio for portrait.
```
watermarkToHeightRatio: 0.05,
watermarkToWidthRatio: 0.2
```

# Tested formats:
Untested formats are not necessarily unsupported.
- Video: MP4
- Image: JPEG

# Help / Contribution
Drop an issue if you have any questions, suggestions or observations. Other not yet implemented cool features I've been thinking about can be found in the [TODO]() file or in code market with `//TODO`.

# Credits
Shout-out to the [node-ffmpeg](https://github.com/damianociarla/node-ffmpeg) project from which I've used the code for getting the overlay in FFmpeg language.