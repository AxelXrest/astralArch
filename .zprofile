# Check if we are on tty1
if [[ "$(tty)" == "/dev/tty1" ]]; then
    # Start Hyprland if not already running
    if ! pgrep -x "Hyprland" > /dev/null; then
        export XDG_SESSION_TYPE=wayland
        export XDG_RUNTIME_DIR=/run/user/$(id -u)
        exec Hyprland > /dev/null 2>&1
    fi
fi
