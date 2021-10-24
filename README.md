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

## Watermarker CLI arguments
```
$ node main.js -h
usage: main.js [-h] [-v] [-d DIRECTORY] [-w WATERMARK] [-p PREFIX] [-od OUTPUT_DIRECTORY]

Add a watermark to a batch of images and videos.

optional arguments:
  -h, --help            show this help message and exit
  -v, --version         show program's version number and exit
  -d DIRECTORY, --directory DIRECTORY
                        Input media files directory path | [Required]
  -w WATERMARK, --watermark WATERMARK
                        Watermark file path | [Required]
  -p PREFIX, --prefix PREFIX
                        Prefix of the new file. OutputFilename = {prefix}{InputFilename} | [Required]
  -od OUTPUT_DIRECTORY, --output_directory OUTPUT_DIRECTORY
                        Output watermarked files drectory. If path doesn't exist, it will be created | [Optional]
```

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
Drop an issue if you have any questions, suggestions or observations. Other not yet implemented cool features I've been thinking about can be found in the [TODO]() file or in code marked with `//TODO`.

# Credits
Shout-out to the [node-ffmpeg](https://github.com/damianociarla/node-ffmpeg) project from which I've used the code for getting the overlay in FFmpeg language.