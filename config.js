module.exports = {
    // SYSTEM
    relevantFileTypes: ["image", "video"],
    ORIENTATION : {
                    LANDSCAPE: "landscape",
                    PORTRAIT: "portrait"
                  },
    exifPortraitCodes: [5,6,7,8],

    // USER
    settings: {
                  position		: "SW"	// Position: NE NC NW SE SC SW C CE CW
                , margin_nord	: null	// Margin nord
                , margin_south	: 15	// Margin sud
                , margin_east	: null	// Margin east
                , margin_west	: 15	// Margin west
            },
    watermarkToHeightRatio: 0.05,
    watermarkToWidthRatio: 0.2
}