#!/bin/bash

# Set the path to the wallpapers directory
wallpapersDir="/home/axel/.config/hypr/wallpapers"

# Enable nullglob to handle cases where no files match the pattern
shopt -s nullglob

# Start an infinite loop
while true; do
    # Get a list of all image files in the wallpapers directory
    wallpapers=("$wallpapersDir"/*.jpg "$wallpapersDir"/*.png)
    # Check if the wallpapers array is empty
    if [ ${#wallpapers[@]} -eq 0 ]; then
        notify-send "No wallpapers found in the directory: $wallpapersDir"
        exit 1
    fi
    # Select a random wallpaper from the array
    selectedWallpaper="${wallpapers[RANDOM % ${#wallpapers[@]}]}"

    # Set the current wallpaper variable to the filename
    current=$(basename "$selectedWallpaper")

    # Debugging output: Print selected wallpaper path
    notify-send "Wallpaper set: $selectedWallpaper"
    echo "Current: $current"
    # Update the wallpaper using the swww img command
    swww img "$selectedWallpaper"

    # Execute color generation script
    "$HOME"/.config/ags/scripts/color_generation/colorgen.sh "$selectedWallpaper" --apply

    # Delay for 45 mins before selecting the next wallpaper
    sleep 15m
done
